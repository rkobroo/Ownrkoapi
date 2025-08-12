import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { storage } from '../storage';

interface VideoInfo {
  title: string;
  platform: string;
  thumbnail: string;
  duration: string;
  channel: string;
  views: string;
  formats: Array<{
    format_id: string;
    ext: string;
    quality: string;
    filesize?: number;
  }>;
}

export class VideoDownloader {
  private downloadsDir: string;

  constructor() {
    this.downloadsDir = path.join(process.cwd(), 'downloads');
    this.ensureDownloadsDir();
  }

  private async ensureDownloadsDir() {
    try {
      await fs.mkdir(this.downloadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create downloads directory:', error);
    }
  }

  private async installYtDlp(): Promise<boolean> {
    try {
      const { execSync } = await import('child_process');
      console.log('Installing yt-dlp at runtime...');
      execSync('python3 -m pip install --user yt-dlp', { stdio: 'inherit' });
      console.log('yt-dlp installed successfully at runtime');
      return true;
    } catch (error) {
      console.error('Runtime yt-dlp installation failed:', error);
      return false;
    }
  }

  private async analyzeTikTokVideo(url: string): Promise<VideoInfo> {
    try {
      const rapidApiKey = process.env.RAPIDAPI_KEY || 'f91bd8b131mshfecb08b2a266b46p10db0cjsn3e18664df0d1';
      if (!rapidApiKey) {
        throw new Error('RapidAPI key not configured for TikTok downloads');
      }

      const response = await fetch('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        },
        body: JSON.stringify({
          url: url,
          hd: 1
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze TikTok video');
      }

      const data = await response.json();
      
      if (!data.data || data.code !== 0) {
        throw new Error('Invalid TikTok video or private content');
      }

      const videoData = data.data;
      
      return {
        title: videoData.title || 'TikTok Video',
        platform: 'TikTok',
        thumbnail: videoData.cover || '',
        duration: this.formatDuration(videoData.duration),
        channel: videoData.author?.unique_id || 'Unknown Author',
        views: this.formatViews(videoData.play_count),
        formats: [
          {
            format_id: 'mp4_hd',
            ext: 'mp4',
            quality: 'HD',
            filesize: undefined
          },
          {
            format_id: 'mp4_sd',
            ext: 'mp4',
            quality: 'SD',
            filesize: undefined
          },
          {
            format_id: 'mp3',
            ext: 'mp3',
            quality: 'audio',
            filesize: undefined
          }
        ]
      };
    } catch (error) {
      // Fallback to error message
      throw new Error(`TikTok analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeWithYtDlp(url: string): Promise<VideoInfo> {
    return new Promise(async (resolve, reject) => {
      try {
        const { command, process: ytDlp } = await this.tryPythonCommand([
          '-m', 'yt_dlp',
          '--dump-json',
          '--no-download',
          url
        ]);

        let output = '';
        let error = '';

        ytDlp.stdout.on('data', (data: any) => {
          output += data.toString();
        });

        ytDlp.stderr.on('data', (data: any) => {
          error += data.toString();
        });

        ytDlp.on('close', (code: any) => {
          if (code !== 0) {
            reject(new Error(`Failed to analyze video: ${error || 'Unknown error'}`));
            return;
          }

          try {
            const lines = output.trim().split('\n').filter(line => line.startsWith('{'));
            if (lines.length === 0) {
              throw new Error('No video information found in response');
            }
            
            const info = JSON.parse(lines[0]);
            const platform = this.detectPlatform(url);
            
            resolve({
              title: info.title || 'Unknown Title',
              platform,
              thumbnail: info.thumbnail || '',
              duration: this.formatDuration(info.duration),
              channel: info.uploader || info.channel || 'Unknown Channel',
              views: this.formatViews(info.view_count),
              formats: info.formats?.map((format: any) => ({
                format_id: format.format_id,
                ext: format.ext,
                quality: format.height ? `${format.height}p` : format.quality || 'audio',
                filesize: format.filesize
              })) || []
            });
          } catch (parseError) {
            reject(new Error(`Unable to extract video information: ${parseError}`));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async tryPythonCommand(args: string[]): Promise<{ command: string; process: any }> {
    // Simplified Python commands - avoid hardcoded paths
    const pythonCommands = ['python3', 'python'];
    
    for (const cmd of pythonCommands) {
      try {
        const process = spawn(cmd, args, {
          stdio: ['pipe', 'pipe', 'pipe']
        });
        return { command: cmd, process };
      } catch (error) {
        console.log(`Failed to spawn ${cmd}:`, error);
        continue;
      }
    }
    
    // If no Python command worked, try to install yt-dlp and retry once
    if (process.env.NODE_ENV === 'production') {
      console.log('Installing yt-dlp at runtime...');
      const installed = await this.installYtDlp();
      
      if (installed) {
        // Try again after installation
        for (const cmd of pythonCommands) {
          try {
            const process = spawn(cmd, args, {
              stdio: ['pipe', 'pipe', 'pipe']
            });
            return { command: cmd, process };
          } catch (error) {
            console.log(`Failed to spawn ${cmd} after installation:`, error);
            continue;
          }
        }
      }
    }
    
    throw new Error('No Python interpreter found. Please ensure Python 3 is installed.');
  }

  async analyzeVideo(url: string): Promise<VideoInfo> {
    // Use yt-dlp for all platforms including TikTok
    if (url.includes('tiktok.com')) {
      return this.analyzeTikTokVideo(url);
    }

    // Use yt-dlp for other platforms
    return this.analyzeWithYtDlp(url);
  }

  async downloadVideo(downloadId: string, url: string, format: string, quality: string): Promise<void> {
    const download = await storage.getDownload(downloadId);
    if (!download) {
      throw new Error('Download not found');
    }

    await storage.updateDownload(downloadId, { status: 'downloading', progress: 0 });

    // Handle TikTok downloads with RapidAPI
    if (url.includes('tiktok.com')) {
      return this.downloadTikTokVideo(downloadId, url, format, quality);
    }

    // Use yt-dlp for other platforms
    const filename = `${downloadId}.%(ext)s`;
    const outputPath = path.join(this.downloadsDir, filename);

    let formatSelector = 'best';
    if (format === 'mp4') {
      if (quality === 'audio') {
        formatSelector = 'bestaudio/best';
      } else if (quality && quality.includes('p')) {
        const height = quality.replace('p', '');
        formatSelector = `best[height<=${height}]`;
      } else {
        formatSelector = 'best';
      }
    } else if (format === 'mp3') {
      formatSelector = 'bestaudio/best';
    }

    const ytDlpArgs = [
      '--output', outputPath,
      '--format', formatSelector,
      url
    ];

    if (format === 'mp3') {
      ytDlpArgs.push('--extract-audio', '--audio-format', 'mp3');
    }

    try {
      const { command, process: ytDlp } = await this.tryPythonCommand(['-m', 'yt_dlp', ...ytDlpArgs]);

      let error = '';

      ytDlp.stderr.on('data', (data: any) => {
        const output = data.toString();
        error += output;

        // Parse progress from yt-dlp output
        const progressMatch = output.match(/(\d+(?:\.\d+)?)%/);
        if (progressMatch) {
          const progress = parseFloat(progressMatch[1]);
          storage.updateDownload(downloadId, { progress });
        }

        // Parse download speed
        const speedMatch = output.match(/(\d+(?:\.\d+)?[KMG]iB\/s)/);
        if (speedMatch) {
          storage.updateDownload(downloadId, { downloadSpeed: speedMatch[1] });
        }
      });

      ytDlp.on('close', async (code: any) => {
        if (code === 0) {
          // Find the actual downloaded file
          const files = await fs.readdir(this.downloadsDir);
          const downloadedFile = files.find(file => file.startsWith(downloadId));
          
          if (downloadedFile) {
            await storage.updateDownload(downloadId, {
              status: 'completed',
              progress: 100,
              filePath: path.join(this.downloadsDir, downloadedFile)
            });
          } else {
            await storage.updateDownload(downloadId, {
              status: 'failed',
              errorMessage: 'Downloaded file not found'
            });
          }
        } else {
          await storage.updateDownload(downloadId, {
            status: 'failed',
            errorMessage: error || 'Download failed'
          });
        }
      });
    } catch (error) {
      await storage.updateDownload(downloadId, {
        status: 'failed',
        errorMessage: `Failed to initialize download: ${error}`
      });
    }
  }

  private async downloadTikTokVideo(downloadId: string, url: string, format: string, quality: string): Promise<void> {
    try {
      const rapidApiKey = process.env.RAPIDAPI_KEY || 'f91bd8b131mshfecb08b2a266b46p10db0cjsn3e18664df0d1';
      if (!rapidApiKey) {
        throw new Error('RapidAPI key not configured for TikTok downloads');
      }

      await storage.updateDownload(downloadId, { progress: 20 });

      const response = await fetch('https://tiktok-video-no-watermark2.p.rapidapi.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
        },
        body: JSON.stringify({
          url: url,
          hd: quality === 'HD' ? 1 : 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get TikTok video data');
      }

      const data = await response.json();
      
      if (!data.data || data.code !== 0) {
        throw new Error('Invalid TikTok video or private content');
      }

      await storage.updateDownload(downloadId, { progress: 50 });

      const videoData = data.data;
      let downloadUrl: string;
      let fileExt: string;

      if (format === 'mp3') {
        downloadUrl = videoData.music;
        fileExt = 'mp3';
      } else {
        downloadUrl = quality === 'HD' ? videoData.hdplay : videoData.play;
        fileExt = 'mp4';
      }

      if (!downloadUrl) {
        throw new Error('No download URL available for this TikTok video');
      }

      // Download the file
      const fileResponse = await fetch(downloadUrl);
      if (!fileResponse.ok) {
        throw new Error('Failed to download TikTok video file');
      }

      await storage.updateDownload(downloadId, { progress: 75 });

      const buffer = await fileResponse.arrayBuffer();
      const filename = `${downloadId}.${fileExt}`;
      const filePath = path.join(this.downloadsDir, filename);

      await fs.writeFile(filePath, Buffer.from(buffer));

      await storage.updateDownload(downloadId, {
        status: 'completed',
        progress: 100,
        filePath: filePath
      });

    } catch (error) {
      await storage.updateDownload(downloadId, {
        status: 'failed',
        errorMessage: `TikTok download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }

  private detectPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('instagram.com')) return 'Instagram';
    if (url.includes('tiktok.com')) return 'TikTok';
    if (url.includes('facebook.com')) return 'Facebook';
    return 'Unknown';
  }

  private formatDuration(seconds: number | null): string {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private formatViews(views: number | null): string {
    if (!views) return '0 views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  }
}
