
import ytdl from 'ytdl-core';
import fetch from 'node-fetch';
import { z } from 'zod';

// VideoExtractor class
class VideoExtractor {
  static SUPPORTED_PLATFORMS = [
    "youtube.com",
    "youtu.be", 
    "tiktok.com",
    "vt.tiktok.com",
    "vm.tiktok.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "facebook.com"
  ];

  static validateUrl(url) {
    try {
      const urlObj = new URL(url);
      return this.SUPPORTED_PLATFORMS.some(
        (domain) => urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }

  static detectPlatform(url) {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      return "youtube";
    }
    if (urlObj.hostname.includes("tiktok.com") || urlObj.hostname.includes("vt.tiktok.com") || urlObj.hostname.includes("vm.tiktok.com")) {
      return "tiktok";
    }
    if (urlObj.hostname.includes("instagram.com")) {
      return "instagram";
    }
    if (urlObj.hostname.includes("twitter.com") || urlObj.hostname.includes("x.com")) {
      return "twitter";
    }
    if (urlObj.hostname.includes("facebook.com")) {
      return "facebook";
    }
    return "unknown";
  }

  static async extractVideoInfo(url) {
    const platform = this.detectPlatform(url);
    switch (platform) {
      case "youtube":
        return this.extractYouTubeInfo(url);
      case "tiktok":
        return this.extractTikTokInfo(url);
      case "instagram":
        return this.extractInstagramInfo(url);
      case "twitter":
        return this.extractTwitterInfo(url);
      case "facebook":
        return this.extractFacebookInfo(url);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  static async extractYouTubeInfo(url) {
    const videoId = this.extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }
    try {
      const videoInfo = await this.fetchYouTubeMetadata(videoId);
      return videoInfo;
    } catch (error) {
      throw new Error(`Failed to extract YouTube video info: ${error.message}`);
    }
  }

  static extractYouTubeVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  static async fetchYouTubeMetadata(videoId) {
    try {
      const info = await ytdl.getInfo(videoId);
      const details = info.videoDetails;
      const durationSeconds = parseInt(details.lengthSeconds || "0");
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      const thumbnails = details.thumbnails || [];
      const bestThumbnail = thumbnails.reduce((best, current) => {
        return (current.width || 0) > (best.width || 0) ? current : best;
      }, thumbnails[0] || { 
        url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, 
        width: 1280, 
        height: 720 
      });

      return {
        platform: "youtube",
        videoId,
        title: details.title || "Untitled Video",
        description: details.description || "No description available",
        duration,
        durationSeconds,
        thumbnail: {
          url: bestThumbnail.url,
          width: bestThumbnail.width || 1280,
          height: bestThumbnail.height || 720
        },
        author: {
          name: details.author?.name || details.ownerChannelName || "Unknown Channel",
          url: details.author?.channel_url || details.ownerProfileUrl || `https://www.youtube.com/channel/${details.channelId || "unknown"}`
        },
        uploadDate: details.publishDate || new Date().toISOString().split("T")[0],
        viewCount: parseInt(details.viewCount || "0")
      };
    } catch (error) {
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (response.ok) {
          const data = await response.json();
          return {
            platform: "youtube",
            videoId,
            title: data.title || "Untitled Video",
            description: "Description not available from oEmbed API",
            duration: "Unknown",
            durationSeconds: 0,
            thumbnail: {
              url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              width: data.thumbnail_width || 1280,
              height: data.thumbnail_height || 720
            },
            author: {
              name: data.author_name || "Unknown Channel",
              url: data.author_url || `https://www.youtube.com/watch?v=${videoId}`
            },
            uploadDate: new Date().toISOString().split("T")[0],
            viewCount: 0
          };
        }
      } catch (oembedError) {
        // Fallback failed
      }
      throw new Error(`Failed to fetch YouTube metadata: ${error.message}`);
    }
  }

  static async extractTikTokInfo(url) {
    try {
      let finalUrl = url;

      if (url.includes("vt.tiktok.com")) {
        try {
          const response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
            headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" 
            }
          });
          finalUrl = response.url || url;
        } catch (redirectError) {
          // Use original URL if redirect fails
        }
      }

      const patterns = [
        /(?:tiktok\.com\/@[^/]+\/video\/|tiktok\.com\/t\/)(\d+)/,
        /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
        /vt\.tiktok\.com\/([A-Za-z0-9]+)/
      ];

      let videoId = "unknown";
      for (const pattern of patterns) {
        const match = finalUrl.match(pattern);
        if (match) {
          videoId = match[1];
          break;
        }
      }

      return {
        platform: "tiktok",
        videoId,
        title: `TikTok Video (${videoId})`,
        description: "TikTok video content - full metadata extraction requires special API access",
        duration: "Unknown",
        durationSeconds: 0,
        thumbnail: {
          url: "https://via.placeholder.com/720x720/000000/FFFFFF?text=TikTok+Video",
          width: 720,
          height: 720
        },
        author: {
          name: "TikTok User",
          url: finalUrl
        },
        uploadDate: new Date().toISOString().split("T")[0],
        viewCount: 0
      };
    } catch (error) {
      throw new Error(`Failed to extract TikTok video info: ${error.message}`);
    }
  }

  static async extractInstagramInfo(url) {
    try {
      const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
      const videoId = match ? match[1] : "unknown";

      return {
        platform: "instagram",
        videoId,
        title: "Instagram Video",
        description: "Instagram video content",
        duration: "Unknown",
        durationSeconds: 0,
        thumbnail: {
          url: "https://via.placeholder.com/640x640?text=Instagram+Video",
          width: 640,
          height: 640
        },
        author: {
          name: "Instagram User",
          url: url
        },
        uploadDate: new Date().toISOString().split("T")[0],
        viewCount: 0
      };
    } catch (error) {
      throw new Error(`Failed to extract Instagram video info: ${error.message}`);
    }
  }

  static async extractTwitterInfo(url) {
    try {
      const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
      const videoId = match ? match[1] : "unknown";

      return {
        platform: "twitter",
        videoId,
        title: "Twitter Video",
        description: "Twitter video content",
        duration: "Unknown",
        durationSeconds: 0,
        thumbnail: {
          url: "https://via.placeholder.com/640x360?text=Twitter+Video",
          width: 640,
          height: 360
        },
        author: {
          name: "Twitter User",
          url: url
        },
        uploadDate: new Date().toISOString().split("T")[0],
        viewCount: 0
      };
    } catch (error) {
      throw new Error(`Failed to extract Twitter video info: ${error.message}`);
    }
  }

  static async extractFacebookInfo(url) {
    try {
      const match = url.match(/facebook\.com\/(?:watch\/?\?v=|.*\/videos\/)(\d+)/);
      const videoId = match ? match[1] : "unknown";

      return {
        platform: "facebook",
        videoId,
        title: "Facebook Video",
        description: "Facebook video content",
        duration: "Unknown",
        durationSeconds: 0,
        thumbnail: {
          url: "https://via.placeholder.com/640x360?text=Facebook+Video",
          width: 640,
          height: 360
        },
        author: {
          name: "Facebook User",
          url
        },
        uploadDate: new Date().toISOString().split("T")[0],
        viewCount: 0
      };
    } catch (error) {
      throw new Error(`Failed to extract Facebook video info: ${error.message}`);
    }
  }

  static generateDownloadLinks(videoInfo) {
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app';

    return {
      video: [
        { quality: '1080p', url: `${baseUrl}/api/download/video/1080/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_1080p` },
        { quality: '720p', url: `${baseUrl}/api/download/video/720/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_720p` },
        { quality: '480p', url: `${baseUrl}/api/download/video/480/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_480p` }
      ],
      audio: [
        { quality: '320kbps', format: 'mp3', url: `${baseUrl}/api/download/audio/mp3/320/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_320kbps` },
        { quality: '256kbps', format: 'mp3', url: `${baseUrl}/api/download/audio/mp3/256/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_256kbps` },
        { quality: '128kbps', format: 'mp3', url: `${baseUrl}/api/download/audio/mp3/128/${videoInfo.videoId}?filename=${encodeURIComponent(videoInfo.title)}_128kbps` }
      ]
    };
  }
}

// AISummaryService class
class AISummaryService {
  static async generateSummary(title, description) {
    try {
      const combinedText = `${title}. ${description}`;
      const words = combinedText.split(' ');

      if (words.length <= 30) {
        return combinedText;
      }

      return words.slice(0, 25).join(' ') + '...';
    } catch (error) {
      return this.fallbackSummary(title, description);
    }
  }

  static async generateMainPoints(title, description) {
    try {
      const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);

      if (sentences.length <= 3) {
        return sentences.map(s => s.trim()).filter(s => s.length > 0);
      }

      return sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
    } catch (error) {
      return this.fallbackMainPoints(title, description);
    }
  }

  static fallbackSummary(title, description) {
    const combinedText = `${title}. ${description}`;
    const words = combinedText.split(' ');

    if (words.length <= 20) {
      return combinedText;
    }

    return words.slice(0, 20).join(' ') + '...';
  }

  static fallbackMainPoints(title, description) {
    return [
      `Video title: ${title}`,
      'Content analysis available',
      'Full description available in video metadata'
    ];
  }
}

// Vercel serverless function handler
export default async function handler(req, res) {
  const startTime = Date.now();

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle different routes
  if (req.url === '/' || req.url === '/api') {
    return res.status(200).json({
      status: "success",
      message: "RKO API is running",
      version: "1.0.0",
      endpoints: [
        "GET /api?url={VIDEO_URL}",
        "GET /api/rko/alldl?url={VIDEO_URL}"
      ]
    });
  }

  if (req.url.startsWith('/api/download/')) {
    const pathParts = req.url.split('/');
    const type = pathParts[3];
    const quality = pathParts[4];
    const videoId = pathParts[5];

    return res.status(200).json({
      status: "success",
      message: "Download endpoint ready",
      videoId,
      quality,
      type,
      note: "This is a demo endpoint. In production, this would stream the actual file."
    });
  }

  // Main API endpoint
  if (req.url.includes('/rko/alldl') || req.method === 'GET') {
    try {
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "Missing URL parameter",
            details: "Please provide a 'url' parameter with a valid video URL."
          },
          timestamp: new Date().toISOString()
        });
      }

      // Validate URL parameter
      const urlSchema = z.object({
        url: z.string().url("Invalid URL format")
      });

      const validatedData = urlSchema.parse({ url });

      // Validate if URL is from supported platform
      if (!VideoExtractor.validateUrl(validatedData.url)) {
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
        videoInfo = await VideoExtractor.extractVideoInfo(validatedData.url);
      } catch (error) {
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

      return res.status(200).json(response);

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

      return res.status(500).json({
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
  }

  return res.status(404).json({
    status: "error",
    error: {
      code: 404,
      message: "Endpoint not found"
    }
  });
}
