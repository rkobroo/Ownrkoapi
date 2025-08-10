import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type VideoAnalysis } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import VideoPreview from "./video-preview";

export default function DownloadForm() {
  const [url, setUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<VideoAnalysis | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: api.analyzeVideo,
    onSuccess: (data) => {
      setVideoInfo(data);
      toast({
        title: "Video analyzed successfully",
        description: `Found: ${data.title}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis failed",
        description: error.message || "Failed to analyze video URL",
        variant: "destructive",
      });
      setVideoInfo(null);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: api.createDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      toast({
        title: "Download started",
        description: "Your download has been queued successfully",
      });
      setUrl("");
      setVideoInfo(null);
    },
    onError: (error: any) => {
      toast({
        title: "Download failed",
        description: error.message || "Failed to start download",
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a video URL",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(url);
  };

  const handleDownload = (format: string, quality: string) => {
    if (!videoInfo) return;
    downloadMutation.mutate({ url, format, quality });
  };

  return (
    <section className="mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Download Videos from Any Platform</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Easily download videos from YouTube, Instagram, TikTok, Facebook and more. High quality downloads with multiple format options.
        </p>
      </div>

      {/* Supported Platforms */}
      <div className="flex justify-center items-center space-x-6 mb-8 flex-wrap gap-4">
        <div className="flex items-center space-x-2 platform-icon">
          <i className="fab fa-youtube text-red-500 text-2xl"></i>
          <span className="text-sm font-medium text-slate-700">YouTube</span>
        </div>
        <div className="flex items-center space-x-2 platform-icon">
          <i className="fab fa-instagram text-pink-500 text-2xl"></i>
          <span className="text-sm font-medium text-slate-700">Instagram</span>
        </div>
        <div className="flex items-center space-x-2 platform-icon">
          <i className="fab fa-tiktok text-slate-900 text-2xl"></i>
          <span className="text-sm font-medium text-slate-700">TikTok</span>
        </div>
        <div className="flex items-center space-x-2 platform-icon">
          <i className="fab fa-facebook text-blue-600 text-2xl"></i>
          <span className="text-sm font-medium text-slate-700">Facebook</span>
        </div>
      </div>

      {/* Download Form */}
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="video-url" className="block text-sm font-medium text-slate-700 mb-2">
              Video URL
            </Label>
            <div className="relative">
              <Input
                type="url"
                id="video-url"
                placeholder="Paste video URL here (YouTube, Instagram, TikTok, Facebook...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pr-12"
              />
              <div className="absolute right-3 top-3 text-slate-400">
                <i className="fas fa-link"></i>
              </div>
            </div>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={handleAnalyze}
              disabled={analyzeMutation.isPending}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {analyzeMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Analyzing...
                </>
              ) : (
                <>
                  <i className="fas fa-search mr-2"></i>
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>

        {videoInfo && (
          <VideoPreview
            videoInfo={videoInfo}
            onDownload={handleDownload}
            isDownloading={downloadMutation.isPending}
          />
        )}
      </div>
    </section>
  );
}
