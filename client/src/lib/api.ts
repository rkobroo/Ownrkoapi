import { apiRequest } from "./queryClient";

export interface VideoAnalysis {
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

export interface CreateDownloadRequest {
  url: string;
  format: string;
  quality: string;
}

export const api = {
  analyzeVideo: async (url: string): Promise<VideoAnalysis> => {
    const response = await apiRequest("POST", "/api/analyze", { url });
    return response.json();
  },

  createDownload: async (data: CreateDownloadRequest) => {
    const response = await apiRequest("POST", "/api/downloads", data);
    return response.json();
  },

  getDownloads: async () => {
    const response = await apiRequest("GET", "/api/downloads");
    return response.json();
  },

  deleteDownload: async (id: string) => {
    await apiRequest("DELETE", `/api/downloads/${id}`);
  }
};
                         
