// Vercel serverless function entry point
import express from 'express';
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { z } from 'zod';

// Inline implementations for Vercel deployment
class VideoExtractor {
  static SUPPORTED_PLATFORMS = [
    'youtube.com',
    'youtu.be',
    'tiktok.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'facebook.com'
  ];

  static validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return this.SUPPORTED_PLATFORMS.some(domain => 
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }

  static detectPlatform(url) {
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (urlObj.hostname.includes('tiktok.com')) {
      return 'tiktok';
    }
    if (urlObj.hostname.includes('instagram.com')) {
      return 'instagram';
    }
    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      return 'twitter';
    }
    if (urlObj.hostname.includes('facebook.com')) {
      return 'facebook';
    }
    
    return 'unknown';
  }

  static async extractVideoInfo(url) {
    const platform = this.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return this.extractYouTubeInfo(url);
      default:
        throw new Error(`Platform ${platform} is not yet implemented`);
    }
  }

  static async extractYouTubeInfo(url) {
    try {
      const info = await ytdl.getInfo(url);
      const videoDetails = info.videoDetails;
      
      return {
        platform: 'youtube',
        videoId: videoDetails.videoId,
        title: videoDetails.title,
        description: videoDetails.description || 'No description available',
        duration: this.formatDuration(parseInt(videoDetails.lengthSeconds)),
        durationSeconds: parseInt(videoDetails.lengthSeconds),
        thumbnail: {
          url: videoDetails.thumbnails[0]?.url || '',
          width: videoDetails.thumbnails[0]?.width || 0,
          height: videoDetails.thumbnails[0]?.height || 0
        },
        author: {
          name: videoDetails.author.name,
          url: videoDetails.author.channel_url
        },
        uploadDate: videoDetails.publishDate,
        viewCount: parseInt(videoDetails.viewCount) || 0
      };
    } catch (error) {
      throw new Error('Failed to extract YouTube video information');
    }
  }

  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  static generateDownloadLinks(videoInfo) {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';
    
    return {
      video: [
        { quality: '1080p', url: `${baseUrl}/download/video/1080/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_1080p` },
        { quality: '720p', url: `${baseUrl}/download/video/720/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_720p` },
        { quality: '480p', url: `${baseUrl}/download/video/480/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_480p` }
      ],
      audio: [
        { quality: '320kbps', format: 'mp3', url: `${baseUrl}/download/audio/mp3/320/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_320kbps` },
        { quality: '256kbps', format: 'mp3', url: `${baseUrl}/download/audio/mp3/256/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_256kbps` },
        { quality: '128kbps', format: 'mp3', url: `${baseUrl}/download/audio/mp3/128/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_128kbps` }
      ]
    };
  }
}

class AISummaryService {
  static async generateSummary(title, description) {
    // Simple summary generation without OpenAI dependency for now
    const combinedText = `${title}. ${description}`;
    const words = combinedText.split(' ');
    
    if (words.length <= 30) {
      return combinedText;
    }
    
    // Take first 25 words and add ellipsis
    return words.slice(0, 25).join(' ') + '...';
  }

  static async generateMainPoints(title, description) {
    // Simple main points extraction
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 3) {
      return sentences.map(s => s.trim()).filter(s => s.length > 0);
    }
    
    // Return first 3 sentences as main points
    return sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Video metadata extraction endpoint
app.get("/rko/alldl", async (req, res) => {
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
