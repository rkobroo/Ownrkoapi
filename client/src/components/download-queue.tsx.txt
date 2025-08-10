import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Download } from "@shared/schema";

export default function DownloadQueue() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: downloads = [], isLoading } = useQuery<Download[]>({
    queryKey: ["/api/downloads"],
    refetchInterval: 2000, // Refresh every 2 seconds for progress updates
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteDownload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downloads"] });
      toast({
        title: "Download removed",
        description: "The download has been removed from the queue",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove download",
        description: "Could not remove the download from the queue",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "failed":
        return "border-red-200 bg-red-50";
      case "downloading":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-slate-200";
    }
  };

  const getStatusText = (download: Download) => {
    switch (download.status) {
      case "pending":
        return "Queued";
      case "analyzing":
        return "Analyzing...";
      case "downloading":
        return `Downloading... ${download.progress}%`;
      case "completed":
        return "Download completed";
      case "failed":
        return `Failed: ${download.errorMessage || "Unknown error"}`;
      default:
        return download.status;
    }
  };

  const clearCompleted = () => {
    const completedDownloads = downloads.filter((d: Download) => d.status === "completed");
    completedDownloads.forEach((download: Download) => {
      deleteMutation.mutate(download.id);
    });
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-center h-32">
            <i className="fas fa-spinner fa-spin text-2xl text-slate-400"></i>
          </div>
        </div>
      </section>
    );
  }

  if (downloads.length === 0) {
    return (
      <section className="mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center py-8">
            <i className="fas fa-download text-4xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No downloads yet</h3>
            <p className="text-slate-500">Start by analyzing a video URL above</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Download Queue</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompleted}
            className="text-slate-500 hover:text-slate-700"
          >
            <i className="fas fa-trash mr-1"></i>
            Clear Completed
          </Button>
        </div>

        <div className="space-y-4">
          {downloads.map((download: Download) => (
            <div
              key={download.id}
              className={`border rounded-lg p-4 ${getStatusColor(download.status)}`}
            >
              <div className="flex items-center space-x-4 mb-3">
                {download.thumbnail ? (
                  <img
                    src={download.thumbnail}
                    alt="Video thumbnail"
                    className="w-12 h-9 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-9 rounded bg-slate-300 flex items-center justify-center">
                    <i className="fas fa-video text-slate-500 text-xs"></i>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">
                    {download.title || "Processing..."}
                  </h4>
                  <p className="text-sm text-slate-500">
                    {download.format?.toUpperCase()} - {download.quality}
                    {download.platform && ` • ${download.platform}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900">
                    {getStatusText(download)}
                  </div>
                  {download.downloadSpeed && (
                    <div className="text-xs text-slate-500">{download.downloadSpeed}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(download.id)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>

              {download.status === "downloading" && (
                <>
                  <Progress value={download.progress || 0} className="mb-2" />
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>
                      {download.downloadedSize && download.fileSize
                        ? `${download.downloadedSize} of ${download.fileSize}`
                        : "Downloading..."}
                    </span>
                    {download.eta && <span>{download.eta} remaining</span>}
                  </div>
                </>
              )}

              {download.status === "completed" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">
                    <i className="fas fa-check-circle mr-1"></i>
                    Ready for download
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => {
                      window.open(`/api/downloads/${download.id}/download`, '_blank');
                    }}
                  >
                    <i className="fas fa-download mr-1"></i>
                    Download
                  </Button>
                </div>
              )}

              {download.status === "failed" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    {download.errorMessage || "Download failed"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <i className="fas fa-redo mr-1"></i>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
