import { VideoRequest, InsertVideoRequest } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getVideoRequest(id: string): Promise<VideoRequest | undefined>;
  createVideoRequest(videoRequest: InsertVideoRequest): Promise<VideoRequest>;
  updateVideoRequest(id: string, updates: Partial<VideoRequest>): Promise<VideoRequest | undefined>;
}

export class MemStorage implements IStorage {
  private videoRequests: Map<string, VideoRequest>;

  constructor() {
    this.videoRequests = new Map();
  }

  async getVideoRequest(id: string): Promise<VideoRequest | undefined> {
    return this.videoRequests.get(id);
  }

  async createVideoRequest(insertVideoRequest: InsertVideoRequest): Promise<VideoRequest> {
    const id = randomUUID();
    const videoRequest: VideoRequest = { 
      ...insertVideoRequest, 
      id,
      platform: '',
      videoId: null,
      title: null,
      description: null,
      duration: null,
      durationSeconds: null,
      thumbnail: null,
      author: null,
      uploadDate: null,
      viewCount: null,
      mainPoints: null,
      aiSummary: null,
      downloadLinks: null,
      createdAt: new Date()
    };
    this.videoRequests.set(id, videoRequest);
    return videoRequest;
  }

  async updateVideoRequest(id: string, updates: Partial<VideoRequest>): Promise<VideoRequest | undefined> {
    const existing = this.videoRequests.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.videoRequests.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
