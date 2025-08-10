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

  private async tryPythonCommand(args: string[]): Promise<{ command: string; process: any }> {
    // Try different Python commands based on environment
    const pythonCommands = process.env.NODE_ENV === 'production' 
      ? [
          '/opt/render/project/.venv/bin/python', // Render virtual env
          '/opt/render/project/.venv/bin/yt-dlp', // Direct yt-dlp in venv
          'python3', 
          'python', 
          'yt-dlp'
        ]
      : ['python', 'python3', 'yt-dlp'];
    
    for (const cmd of pythonCommands) {
      try {
        if (cmd.includes('yt-dlp') && !cmd.includes('python')) {
          return { command: cmd, process: spawn(cmd, args.slice(2)) }; // Remove '-m yt_dlp'
        } else {
          return { command: cmd, process: spawn(cmd, args) };
        }
      } catch (error) {
        continue;
      }
    }
    throw new Error('No Python or yt-dlp command found');
  }

  async analyzeVideo(url: string): Promise<VideoInfo> {
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
            reject(new Error(`yt-dlp failed: ${error}`));
            return;
          }

          try {
            const info = JSON.parse(output.trim().split('\n')[0]);
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
            reject(new Error(`Failed to parse video info: ${parseError}`));
          }
        });
      } catch (error) {
        reject(new Error(`Failed to initialize yt-dlp: ${error}`));
      }
    });
  }

  async downloadVideo(downloadId: string, url: string, format: string, quality: string): Promise<void> {
    const download = await storage.getDownload(downloadId);
    if (!download) {
      throw new Error('Download not found');
    }

    await storage.updateDownload(downloadId, { status: 'downloading', progress: 0 });

    const filename = `${downloadId}.%(ext)s`;
    const outputPath = path.join(this.downloadsDir, filename);

    let formatSelector = 'best';
    if (format === 'mp4') {
      formatSelector = quality === 'audio' ? 'bestaudio/best' : `best[height<=${quality.replace('p', '')}]`;
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
