import { type Download, type InsertDownload, type UpdateDownload } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getDownload(id: string): Promise<Download | undefined>;
  getDownloads(): Promise<Download[]>;
  createDownload(download: InsertDownload): Promise<Download>;
  updateDownload(id: string, updates: UpdateDownload): Promise<Download | undefined>;
  deleteDownload(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private downloads: Map<string, Download>;

  constructor() {
    this.downloads = new Map();
  }

  async getDownload(id: string): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async getDownloads(): Promise<Download[]> {
    return Array.from(this.downloads.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = randomUUID();
    const now = new Date();
    const download: Download = {
      ...insertDownload,
      id,
      title: null,
      platform: "",
      thumbnail: null,
      duration: null,
      channel: null,
      views: null,
      fileSize: null,
      status: "pending",
      progress: 0,
      downloadSpeed: null,
      downloadedSize: null,
      eta: null,
      errorMessage: null,
      filePath: null,
      createdAt: now,
      updatedAt: now,
    };
    this.downloads.set(id, download);
    return download;
  }

  async updateDownload(id: string, updates: UpdateDownload): Promise<Download | undefined> {
    const existing = this.downloads.get(id);
    if (!existing) return undefined;

    const updated: Download = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.downloads.set(id, updated);
    return updated;
  }

  async deleteDownload(id: string): Promise<boolean> {
    return this.downloads.delete(id);
  }
}

export const storage = new MemStorage();
