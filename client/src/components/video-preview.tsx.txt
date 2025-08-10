import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { type VideoAnalysis } from "@/lib/api";

interface VideoPreviewProps {
  videoInfo: VideoAnalysis;
  onDownload: (format: string, quality: string) => void;
  isDownloading: boolean;
}

export default function VideoPreview({ videoInfo, onDownload, isDownloading }: VideoPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState("mp4-1080p");
  const [selectedAudioFormat, setSelectedAudioFormat] = useState("");

  const getVideoFormats = () => {
    const videoFormats = videoInfo.formats.filter(f => f.ext === 'mp4' || f.quality.includes('p'));
    const uniqueQualities = [...new Set(videoFormats.map(f => f.quality))];
    return uniqueQualities.slice(0, 3); // Show top 3 qualities
  };

  const getAudioFormats = () => {
    return ['mp3-320k', 'mp3-128k'];
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const format = selectedAudioFormat ? 'mp3' : 'mp4';
    const quality = selectedAudioFormat ? selectedAudioFormat.split('-')[1] : selectedFormat.split('-')[1];
    onDownload(format, quality);
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50">
      {/* Video Info */}
      <div className="flex items-start space-x-4 mb-6">
        <div className="flex-shrink-0">
          {videoInfo.thumbnail ? (
            <img
              src={videoInfo.thumbnail}
              alt="Video thumbnail"
              className="w-24 h-18 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-18 rounded-lg bg-slate-300 flex items-center justify-center">
              <i className="fas fa-video text-slate-500"></i>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 mb-1">{videoInfo.title}</h3>
          <p className="text-sm text-slate-600 mb-2">{videoInfo.channel}</p>
          <div className="flex items-center space-x-4 text-sm text-slate-500 flex-wrap">
            <span>{videoInfo.duration}</span>
            <span>{videoInfo.views}</span>
            <span className="text-blue-600 font-medium">{videoInfo.platform}</span>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-3">Video Format</Label>
          <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
            <div className="space-y-2">
              {getVideoFormats().map((quality) => (
                <div key={`mp4-${quality}`} className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value={`mp4-${quality}`} id={`mp4-${quality}`} />
                  <Label htmlFor={`mp4-${quality}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">MP4 - {quality}</span>
                      <span className="text-sm text-slate-500">{formatFileSize()}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {quality === '1080p' ? 'Best quality' : quality === '720p' ? 'Good quality' : 'Standard quality'}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label className="block text-sm font-medium text-slate-700 mb-3">Audio Format</Label>
          <RadioGroup value={selectedAudioFormat} onValueChange={setSelectedAudioFormat}>
            <div className="space-y-2">
              {getAudioFormats().map((format) => (
                <div key={format} className="flex items-center space-x-2 p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                  <RadioGroupItem value={format} id={format} />
                  <Label htmlFor={format} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">MP3 - {format.split('-')[1]}</span>
                      <span className="text-sm text-slate-500">{format.includes('320') ? '~12 MB' : '~5 MB'}</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {format.includes('320') ? 'High quality audio' : 'Standard audio'}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Download Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="bg-green-500 text-white hover:bg-green-600 px-8 py-3"
        >
          {isDownloading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Starting Download...
            </>
          ) : (
            <>
              <i className="fas fa-download mr-2"></i>
              Start Download
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
