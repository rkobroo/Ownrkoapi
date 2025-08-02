import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { VideoExtractor } from "./services/videoExtractor";
import { AISummaryService } from "./services/aiSummary";
import { videoMetadataSchema, apiErrorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting store (in production, use Redis)
  const rateLimits = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 100; // requests per hour
  const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

  // Rate limiting middleware
  const rateLimit = (req: any, res: any, next: any) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientLimit = rateLimits.get(clientIp);
    
    if (!clientLimit || now > clientLimit.resetTime) {
      rateLimits.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      res.set('X-RateLimit-Remaining', (RATE_LIMIT - 1).toString());
      return next();
    }
    
    if (clientLimit.count >= RATE_LIMIT) {
      return res.status(429).json({
        status: "error",
        error: {
          code: 429,
          message: "Rate limit exceeded",
          details: "You have exceeded the maximum number of requests per hour. Please try again later."
        },
        timestamp: new Date().toISOString()
      });
    }
    
    clientLimit.count++;
    rateLimits.set(clientIp, clientLimit);
    res.set('X-RateLimit-Remaining', (RATE_LIMIT - clientLimit.count).toString());
    next();
  };

  // Video metadata extraction endpoint
  app.get("/rko/alldl", rateLimit, async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validate URL parameter
      const urlSchema = z.object({
        url: z.string().url("Invalid URL format")
      });
      
      const { url } = urlSchema.parse(req.query);
      
      // Validate if URL is from supported platform
      if (!VideoExtractor.validateUrl(url)) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "Unsupported platform",
            details: "The provided URL is not from a supported social media platform."
          },
          timestamp: new Date().toISOString()
        });
      }

      // Extract video information
      let videoInfo;
      try {
        videoInfo = await VideoExtractor.extractVideoInfo(url);
      } catch (error: any) {
        if (error.message && error.message.includes('not yet implemented')) {
          return res.status(503).json({
            status: "error",
            error: {
              code: 503,
              message: "Platform temporarily unavailable",
              details: "This platform is currently under development. Please try again later."
            },
            timestamp: new Date().toISOString()
          });
        }
        
        return res.status(404).json({
          status: "error",
          error: {
            code: 404,
            message: "Video not found",
            details: "The video could not be found or may be private/deleted."
          },
          timestamp: new Date().toISOString()
        });
      }

      // Generate AI summary and main points
      const [mainPoints, aiSummary] = await Promise.all([
        AISummaryService.generateMainPoints(videoInfo.title, videoInfo.description),
        AISummaryService.generateSummary(videoInfo.title, videoInfo.description)
      ]);

      // Generate download links
      const downloadLinks = VideoExtractor.generateDownloadLinks(videoInfo);

      const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

      const response = {
        status: "success",
        data: {
          platform: videoInfo.platform,
          video_id: videoInfo.videoId,
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          duration_seconds: videoInfo.durationSeconds,
          thumbnail: videoInfo.thumbnail,
          author: videoInfo.author,
          upload_date: videoInfo.uploadDate,
          view_count: videoInfo.viewCount,
          main_points: mainPoints,
          ai_summary: aiSummary,
          download_links: downloadLinks
        },
        timestamp: new Date().toISOString(),
        processing_time: `${processingTime}s`
      };

      res.json(response);
      
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "Invalid request parameters",
            details: error.errors.map(e => e.message).join(', ')
          },
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        status: "error",
        error: {
          code: 500,
          message: "Internal server error",
          details: "An unexpected error occurred while processing your request."
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  // Download endpoints
  app.get("/download/video/:quality/:videoId", (req, res) => {
    const { quality, videoId } = req.params;
    const filename = req.query.filename || `video_${videoId}_${quality}.mp4`;
    
    res.json({
      status: "success",
      message: "Download endpoint ready",
      videoId,
      quality,
      filename,
      note: "This is a demo endpoint. In production, this would stream the actual video file."
    });
  });

  app.get("/download/audio/:quality/:videoId", (req, res) => {
    const { quality, videoId } = req.params;
    const filename = req.query.filename || `audio_${videoId}_${quality}.mp3`;
    
    res.json({
      status: "success",
      message: "Download endpoint ready",
      videoId,
      quality,
      filename,
      note: "This is a demo endpoint. In production, this would stream the actual audio file."
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "online",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
