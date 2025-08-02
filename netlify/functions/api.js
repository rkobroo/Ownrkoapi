
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const { z } = require('zod');

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
      throw new Error(`Failed to fetch YouTube metadata: ${error.message}`);
    }
  }

  static async extractTikTokInfo(url) {
    try {
      let finalUrl = url;
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
        description: "TikTok video content",
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
  }

  static async extractTwitterInfo(url) {
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
  }

  static async extractFacebookInfo(url) {
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
  }

  static generateDownloadLinks(videoInfo) {
    const baseUrl = process.env.URL || 'https://your-app.netlify.app';

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

// AISummaryService class
class AISummaryService {
  static async generateSummary(title, description) {
    const combinedText = `${title}. ${description}`;
    const words = combinedText.split(' ');
    if (words.length <= 30) return combinedText;
    return words.slice(0, 25).join(' ') + '...';
  }

  static async generateMainPoints(title, description) {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 3) return sentences.map(s => s.trim()).filter(s => s.length > 0);
    return sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
  }
}

// Netlify function handler
exports.handler = async (event, context) => {
  const startTime = Date.now();

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { url } = event.queryStringParameters || {};

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: "error",
          error: {
            code: 400,
            message: "Missing URL parameter",
            details: "Please provide a 'url' parameter with a valid video URL."
          },
          timestamp: new Date().toISOString()
        })
      };
    }

    // Validate URL
    if (!VideoExtractor.validateUrl(url)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          status: "error",
          error: {
            code: 400,
            message: "Unsupported platform",
            details: "The provided URL is not from a supported social media platform."
          },
          timestamp: new Date().toISOString()
        })
      };
    }

    // Extract video information
    const videoInfo = await VideoExtractor.extractVideoInfo(url);
    const [mainPoints, aiSummary] = await Promise.all([
      AISummaryService.generateMainPoints(videoInfo.title, videoInfo.description),
      AISummaryService.generateSummary(videoInfo.title, videoInfo.description)
    ]);

    const downloadLinks = VideoExtractor.generateDownloadLinks(videoInfo);
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
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
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: "error",
        error: {
          code: 500,
          message: "Internal server error",
          details: error.message
        },
        timestamp: new Date().toISOString()
      })
    };
  }
};
