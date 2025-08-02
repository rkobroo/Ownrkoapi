import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  Download, 
  Settings, 
  Play, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Github,
  Book,
  Mail,
  Youtube,
  Instagram,
  Twitter,
  Facebook
} from "lucide-react";

interface VideoData {
  platform: string;
  video_id: string;
  title: string;
  description: string;
  duration: string;
  duration_seconds: number;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  author: {
    name: string;
    url: string;
  };
  upload_date: string;
  view_count: number;
  main_points: string[];
  ai_summary: string;
  download_links: {
    video?: Record<string, string>;
    audio?: Record<string, string>;
  };
}

interface ApiResponse {
  status: string;
  data?: VideoData;
  error?: {
    code: number;
    message: string;
    details?: string;
  };
  timestamp: string;
  processing_time?: string;
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [responseTime, setResponseTime] = useState<string>("0s");
  const { toast } = useToast();

  const baseApiUrl = `${window.location.origin}/rko/alldl?url=`;

  const validateUrl = (url: string): boolean => {
    const supportedDomains = ['youtube.com', 'youtu.be', 'tiktok.com', 'instagram.com', 'twitter.com', 'x.com', 'facebook.com'];
    try {
      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  };

  const handleApiRequest = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a video URL",
        variant: "destructive"
      });
      return;
    }

    if (!validateUrl(videoUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL from a supported platform",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`/rko/alldl?url=${encodeURIComponent(videoUrl)}`);
      const data: ApiResponse = await response.json();
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      setResponseTime(`${duration}s`);
      
      setResponse(data);
      
      if (data.status === "success") {
        toast({
          title: "Success",
          description: "Video metadata extracted successfully",
        });
      } else {
        toast({
          title: "API Error",
          description: data.error?.message || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Failed to connect to the API",
        variant: "destructive"
      });
      setResponse({
        status: "error",
        error: {
          code: 500,
          message: "Network error",
          details: "Failed to connect to the API server"
        },
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'youtube': return <Youtube className="text-red-500" />;
      case 'instagram': return <Instagram className="text-purple-500" />;
      case 'twitter': return <Twitter className="text-blue-400" />;
      case 'facebook': return <Facebook className="text-blue-600" />;
      default: return <Download />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Download className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">RKO API</h1>
                <p className="text-sm text-gray-500">Social Media Video Downloader</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                API Online
              </Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* API Tester Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* API Endpoint Card */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">API Endpoint Tester</h2>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">GET</Badge>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                    <div className="relative">
                      <Input 
                        value={baseApiUrl}
                        readOnly
                        className="bg-gray-50 border-gray-200 font-mono text-sm text-gray-600 pr-10"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => copyToClipboard(baseApiUrl)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                    <div className="flex space-x-3">
                      <Input 
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=example or https://www.tiktok.com/@user/video/123"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className={`flex-1 ${videoUrl && !validateUrl(videoUrl) ? 'border-red-500' : ''}`}
                      />
                      <Button 
                        onClick={handleApiRequest}
                        disabled={isLoading}
                        className="bg-primary hover:bg-blue-700 text-white font-medium px-6"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Test API
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Preview */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Response Preview</h3>
                  <div className="flex items-center space-x-2">
                    {response && (
                      <Badge 
                        variant="outline" 
                        className={response.status === "success" ? "bg-success/10 text-success border-success/20" : "bg-error/10 text-error border-error/20"}
                      >
                        {response.status === "success" ? "200 OK" : `${response.error?.code || 500} Error`}
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500">Response time: {responseTime}</span>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 font-mono text-sm leading-relaxed">
                    <code>{response ? JSON.stringify(response, null, 2) : 'No response yet. Test the API with a video URL above.'}</code>
                  </pre>
                </div>
                
                {response && (
                  <div className="mt-4 flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Response
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-3 w-3 mr-1" />
                      Download JSON
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Preview Card */}
            {response?.status === "success" && response.data && (
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Preview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img 
                        src={response.data.thumbnail.url} 
                        alt="Video thumbnail" 
                        className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=450";
                        }}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-500">Duration: {response.data.duration}</span>
                        <span className="text-sm text-gray-500">720p Available</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{response.data.title}</h4>
                        <p className="text-sm text-gray-600">{response.data.author.name}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Main Points:</h5>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {response.data.main_points.map((point, index) => (
                            <li key={index}>• {point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Documentation Sidebar */}
          <div className="space-y-6">
            
            {/* Supported Platforms */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Platforms</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Youtube className="text-red-500 text-xl" />
                    <div>
                      <div className="font-medium text-gray-900">YouTube</div>
                      <div className="text-sm text-gray-500">Videos, Shorts</div>
                    </div>
                    <CheckCircle className="ml-auto text-success h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">T</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">TikTok</div>
                      <div className="text-sm text-gray-500">All video formats</div>
                    </div>
                    <CheckCircle className="ml-auto text-success h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Instagram className="text-purple-500 text-xl" />
                    <div>
                      <div className="font-medium text-gray-900">Instagram</div>
                      <div className="text-sm text-gray-500">Reels, IGTV, Posts</div>
                    </div>
                    <CheckCircle className="ml-auto text-success h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Twitter className="text-blue-400 text-xl" />
                    <div>
                      <div className="font-medium text-gray-900">Twitter/X</div>
                      <div className="text-sm text-gray-500">Video tweets</div>
                    </div>
                    <Clock className="ml-auto text-warning h-4 w-4" />
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Facebook className="text-blue-600 text-xl" />
                    <div>
                      <div className="font-medium text-gray-900">Facebook</div>
                      <div className="text-sm text-gray-500">Public videos</div>
                    </div>
                    <Clock className="ml-auto text-warning h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Documentation */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Documentation</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Format</h4>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <code className="text-green-400 font-mono text-xs">GET /api/dipto/alldl?url={encodeURIComponent('VIDEO_URL')}</code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-mono text-gray-600">url</span>
                        <span className="text-gray-500">required</span>
                      </div>
                      <p className="text-gray-600 text-xs">Valid social media video URL</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Response Fields</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="font-mono">• title, description, duration</div>
                      <div className="font-mono">• thumbnail, author, upload_date</div>
                      <div className="font-mono">• main_points[], ai_summary</div>
                      <div className="font-mono">• download_links{}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rate Limits */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Limits</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Free Tier</div>
                      <div className="text-sm text-gray-500">100 requests/hour</div>
                    </div>
                    <span className="text-primary font-semibold">75/100</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <AlertCircle className="inline h-3 w-3 mr-1" />
                    Resets at the top of each hour
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Codes */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Errors</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-12 h-6 bg-error/10 text-error border-error/20 text-xs font-mono justify-center">400</Badge>
                    <span className="text-gray-600">Invalid URL format</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-12 h-6 bg-error/10 text-error border-error/20 text-xs font-mono justify-center">404</Badge>
                    <span className="text-gray-600">Video not found</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-12 h-6 bg-warning/10 text-warning border-warning/20 text-xs font-mono justify-center">429</Badge>
                    <span className="text-gray-600">Rate limit exceeded</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="w-12 h-6 bg-error/10 text-error border-error/20 text-xs font-mono justify-center">503</Badge>
                    <span className="text-gray-600">Platform unavailable</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="text-sm text-gray-500">
                © 2024 Noobs API. Built for developers.
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Book className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
