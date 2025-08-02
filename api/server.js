// Vercel serverless function entry point
import express from 'express';
import { VideoExtractor } from '../server/services/videoExtractor.js';
import { AISummaryService } from '../server/services/aiSummary.js';
import { z } from 'zod';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting for Vercel
const rateLimits = new Map();
const RATE_LIMIT = 100; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

const rateLimit = (req, res, next) => {
  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  let clientLimit = rateLimits.get(clientIp);
  if (!clientLimit || now - clientLimit.resetTime > RATE_WINDOW) {
    clientLimit = { count: 0, resetTime: now };
    rateLimits.set(clientIp, clientLimit);
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
    } catch (error) {
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

    res.status(200).json(response);

  } catch (error) {
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid request parameters",
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        timestamp: new Date().toISOString(),
        processing_time: `${processingTime}s`
      });
    }

    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: "Internal server error",
        details: "An unexpected error occurred while processing your request."
      },
      timestamp: new Date().toISOString(),
      processing_time: `${processingTime}s`
    });
  }
});

// Download endpoints
app.get('/download/:type/:quality/:videoId', (req, res) => {
  const { type, quality, videoId } = req.params;
  const filename = req.query.filename || `${videoId}_${quality}`;
  
  res.json({
    status: "success",
    message: "Download endpoint ready",
    videoId,
    quality: `${quality}${type === 'audio' ? '' : 'p'}`,
    type,
    filename,
    note: "This is a demo endpoint. In production, this would stream the actual video file."
  });
});

app.get('/download/:type/:format/:quality/:videoId', (req, res) => {
  const { type, format, quality, videoId } = req.params;
  const filename = req.query.filename || `${videoId}_${quality}kbps.${format}`;
  
  res.json({
    status: "success",
    message: "Download endpoint ready",
    videoId,
    quality: `${quality}kbps`,
    format,
    type,
    filename,
    note: "This is a demo endpoint. In production, this would stream the actual audio file."
  });
});

export default app;
