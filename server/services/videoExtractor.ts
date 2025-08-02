import { VideoMetadataResponse } from "@shared/schema";
import ytdl from "ytdl-core";
import fetch from "node-fetch";

interface VideoInfo {
  platform: string;
  videoId: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  author: {
    name: string;
    url: string;
  };
  uploadDate: string;
  viewCount: number;
}

export class VideoExtractor {
  private static SUPPORTED_PLATFORMS = [
    'youtube.com',
    'youtu.be',
    'tiktok.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'facebook.com'
  ];

  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.SUPPORTED_PLATFORMS.some(domain => 
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }

  static detectPlatform(url: string): string {
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

  static async extractVideoInfo(url: string): Promise<VideoInfo> {
    const platform = this.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return this.extractYouTubeInfo(url);
      case 'tiktok':
        return this.extractTikTokInfo(url);
      case 'instagram':
        return this.extractInstagramInfo(url);
      case 'twitter':
        return this.extractTwitterInfo(url);
      case 'facebook':
        return this.extractFacebookInfo(url);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  private static async extractYouTubeInfo(url: string): Promise<VideoInfo> {
    // Extract video ID from YouTube URL
    const videoId = this.extractYouTubeVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // In a real implementation, you would use youtube-dl-exec, ytdl-core, or YouTube Data API
    // For now, we'll simulate the extraction process
    try {
      // This would be replaced with actual YouTube API calls or youtube-dl
      const videoInfo = await this.fetchYouTubeMetadata(videoId);
      return videoInfo;
    } catch (error: any) {
      throw new Error(`Failed to extract YouTube video info: ${error.message}`);
    }
  }

  private static extractYouTubeVideoId(url: string): string | null {
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

  private static async fetchYouTubeMetadata(videoId: string): Promise<VideoInfo> {
    try {
      // Get video info using ytdl-core
      const info = await ytdl.getInfo(videoId);
      const details = info.videoDetails;
      
      // Parse duration from seconds to readable format
      const durationSeconds = parseInt(details.lengthSeconds || '0');
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Get the best thumbnail
      const thumbnails = details.thumbnails || [];
      const bestThumbnail = thumbnails.reduce((best, current) => {
        return (current.width || 0) > (best.width || 0) ? current : best;
      }, thumbnails[0] || { url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 });
      
      return {
        platform: 'youtube',
        videoId,
        title: details.title || 'Untitled Video',
        description: details.description || 'No description available',
        duration,
        durationSeconds,
        thumbnail: {
          url: bestThumbnail.url,
          width: bestThumbnail.width || 1280,
          height: bestThumbnail.height || 720
        },
        author: {
          name: details.author?.name || details.ownerChannelName || 'Unknown Channel',
          url: details.author?.channel_url || details.ownerProfileUrl || `https://www.youtube.com/channel/${details.channelId || 'unknown'}`
        },
        uploadDate: details.publishDate || new Date().toISOString().split('T')[0],
        viewCount: parseInt(details.viewCount || '0')
      };
    } catch (error: any) {
      // If ytdl-core fails, try to get basic info from YouTube oEmbed API
      try {
        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (response.ok) {
          const data = await response.json() as any;
          return {
            platform: 'youtube',
            videoId,
            title: data.title || 'Untitled Video',
            description: 'Description not available from oEmbed API',
            duration: 'Unknown',
            durationSeconds: 0,
            thumbnail: {
              url: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              width: data.thumbnail_width || 1280,
              height: data.thumbnail_height || 720
            },
            author: {
              name: data.author_name || 'Unknown Channel',
              url: data.author_url || `https://www.youtube.com/watch?v=${videoId}`
            },
            uploadDate: new Date().toISOString().split('T')[0],
            viewCount: 0
          };
        }
      } catch (oembedError) {
        // Fall back to basic info if both methods fail
      }
      
      throw new Error(`Failed to fetch YouTube metadata: ${error.message}`);
    }
  }

  private static async extractTikTokInfo(url: string): Promise<VideoInfo> {
    try {
      // Extract TikTok video ID from URL
      const match = url.match(/(?:tiktok\.com\/@[^/]+\/video\/|tiktok\.com\/t\/)(\d+)/);
      const videoId = match ? match[1] : 'unknown';
      
      // Try to get basic info from TikTok oEmbed API
      const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json() as any;
        return {
          platform: 'tiktok',
          videoId,
          title: data.title || 'TikTok Video',
          description: 'TikTok video content',
          duration: 'Unknown',
          durationSeconds: 0,
          thumbnail: {
            url: data.thumbnail_url || 'https://via.placeholder.com/720x720?text=TikTok+Video',
            width: data.thumbnail_width || 720,
            height: data.thumbnail_height || 720
          },
          author: {
            name: data.author_name || 'TikTok User',
            url: data.author_url || url
          },
          uploadDate: new Date().toISOString().split('T')[0],
          viewCount: 0
        };
      }
      throw new Error('Failed to fetch TikTok oEmbed data');
    } catch (error: any) {
      throw new Error(`Failed to extract TikTok video info: ${error.message}`);
    }
  }

  private static async extractInstagramInfo(url: string): Promise<VideoInfo> {
    try {
      // Extract Instagram post ID from URL
      const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
      const videoId = match ? match[1] : 'unknown';
      
      // Try to get basic info from Instagram oEmbed API
      const response = await fetch(`https://graph.facebook.com/v8.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=guest`);
      if (response.ok) {
        const data = await response.json() as any;
        return {
          platform: 'instagram',
          videoId,
          title: data.title || 'Instagram Video',
          description: 'Instagram video content',
          duration: 'Unknown',
          durationSeconds: 0,
          thumbnail: {
            url: data.thumbnail_url || 'https://via.placeholder.com/640x640?text=Instagram+Video',
            width: data.thumbnail_width || 640,
            height: data.thumbnail_height || 640
          },
          author: {
            name: data.author_name || 'Instagram User',
            url: data.author_url || url
          },
          uploadDate: new Date().toISOString().split('T')[0],
          viewCount: 0
        };
      }
      throw new Error('Failed to fetch Instagram oEmbed data');
    } catch (error: any) {
      throw new Error(`Failed to extract Instagram video info: ${error.message}`);
    }
  }

  private static async extractTwitterInfo(url: string): Promise<VideoInfo> {
    try {
      // Extract Twitter tweet ID from URL
      const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
      const videoId = match ? match[1] : 'unknown';
      
      // Try to get basic info from Twitter oEmbed API
      const response = await fetch(`https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json() as any;
        return {
          platform: 'twitter',
          videoId,
          title: 'Twitter Video',
          description: data.html ? data.html.replace(/<[^>]*>/g, '').substring(0, 200) : 'Twitter video content',
          duration: 'Unknown',
          durationSeconds: 0,
          thumbnail: {
            url: 'https://via.placeholder.com/640x360?text=Twitter+Video',
            width: 640,
            height: 360
          },
          author: {
            name: data.author_name || 'Twitter User',
            url: data.author_url || url
          },
          uploadDate: new Date().toISOString().split('T')[0],
          viewCount: 0
        };
      }
      throw new Error('Failed to fetch Twitter oEmbed data');
    } catch (error: any) {
      throw new Error(`Failed to extract Twitter video info: ${error.message}`);
    }
  }

  private static async extractFacebookInfo(url: string): Promise<VideoInfo> {
    try {
      // Extract Facebook video ID from URL  
      const match = url.match(/facebook\.com\/(?:watch\/?\?v=|.*\/videos\/)(\d+)/);
      const videoId = match ? match[1] : 'unknown';
      
      return {
        platform: 'facebook',
        videoId,
        title: 'Facebook Video',
        description: 'Facebook video content',
        duration: 'Unknown',
        durationSeconds: 0,
        thumbnail: {
          url: 'https://via.placeholder.com/640x360?text=Facebook+Video',
          width: 640,
          height: 360
        },
        author: {
          name: 'Facebook User',
          url: url
        },
        uploadDate: new Date().toISOString().split('T')[0],
        viewCount: 0
      };
    } catch (error: any) {
      throw new Error(`Failed to extract Facebook video info: ${error.message}`);
    }
  }

  static generateDownloadLinks(videoInfo: VideoInfo): any {
    // Generate download links using custom base URL
    const baseUrl = 'https://rkodownloder.rf.gd';
    
    // Clean the title for use in filename (remove special characters)
    const cleanTitle = videoInfo.title
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length to 100 characters
    
    return {
      video: {
        '720p': `${baseUrl}/download/video/720p/${videoInfo.videoId}?filename=${encodeURIComponent(cleanTitle)}_720p.mp4`,
        '480p': `${baseUrl}/download/video/480p/${videoInfo.videoId}?filename=${encodeURIComponent(cleanTitle)}_480p.mp4`,
        '360p': `${baseUrl}/download/video/360p/${videoInfo.videoId}?filename=${encodeURIComponent(cleanTitle)}_360p.mp4`
      },
      audio: {
        'mp3_128': `${baseUrl}/download/audio/mp3/128/${videoInfo.videoId}?filename=${encodeURIComponent(cleanTitle)}_128kbps.mp3`,
        'mp3_320': `${baseUrl}/download/audio/mp3/320/${videoInfo.videoId}?filename=${encodeURIComponent(cleanTitle)}_320kbps.mp3`
      }
    };
  }
}
