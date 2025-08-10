import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { VideoDownloader } from "./services/videoDownloader";
import { insertDownloadSchema, updateDownloadSchema } from "@shared/schema";
import { z } from "zod";

const videoDownloader = new VideoDownloader();

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint to prevent sleep on free hosting
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date(),
      service: 'VideoSnap Downloader'
    });
  });

  // Get all downloads
  app.get("/api/downloads", async (req, res) => {
    try {
      const downloads = await storage.getDownloads();
      res.json(downloads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch downloads" });
    }
  });

  // Get single download
  app.get("/api/downloads/:id", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      res.json(download);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch download" });
    }
  });

  // Analyze video URL
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      const videoInfo = await videoDownloader.analyzeVideo(url);
      res.json(videoInfo);
    } catch (error) {
      console.error("Analysis failed:", error);
      res.status(400).json({ 
        error: "Failed to analyze video", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Create new download
  app.post("/api/downloads", async (req, res) => {
    try {
      const validatedData = insertDownloadSchema.parse(req.body);
      
      // First analyze the video to get metadata
      const videoInfo = await videoDownloader.analyzeVideo(validatedData.url);
      
      const download = await storage.createDownload(validatedData);
      
      // Update with video metadata
      await storage.updateDownload(download.id, {
        title: videoInfo.title,
        platform: videoInfo.platform,
        thumbnail: videoInfo.thumbnail,
        duration: videoInfo.duration,
        channel: videoInfo.channel,
        views: videoInfo.views,
        status: "analyzing"
      });

      // Start download process asynchronously
      videoDownloader.downloadVideo(
        download.id, 
        validatedData.url, 
        validatedData.format, 
        validatedData.quality
      ).catch(console.error);

      const updatedDownload = await storage.getDownload(download.id);
      res.status(201).json(updatedDownload);
    } catch (error) {
      console.error("Download creation failed:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ 
        error: "Failed to create download",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update download
  app.patch("/api/downloads/:id", async (req, res) => {
    try {
      const validatedData = updateDownloadSchema.parse(req.body);
      const download = await storage.updateDownload(req.params.id, validatedData);
      
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      res.json(download);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update download" });
    }
  });

  // Download file
  app.get("/api/downloads/:id/download", async (req, res) => {
    try {
      const download = await storage.getDownload(req.params.id);
      if (!download) {
        return res.status(404).json({ error: "Download not found" });
      }
      
      if (download.status !== "completed" || !download.filePath) {
        return res.status(400).json({ error: "Download not ready" });
      }

      // Check if file exists
      const fs = await import('fs');
      if (!fs.existsSync(download.filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      // Set appropriate headers for file download
      const path = await import('path');
      const filename = path.basename(download.filePath);
      const sanitizedTitle = download.title?.replace(/[^a-zA-Z0-9\s\-_]/g, '') || 'video';
      const extension = path.extname(filename);
      const downloadName = `${sanitizedTitle}${extension}`;

      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(download.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("File download failed:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Delete download
  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      const success = await storage.deleteDownload(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Download not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete download" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
