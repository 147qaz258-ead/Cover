"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MasonryGrid, MasonryItem } from "@/components/display/masonry-grid";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Share2, AlertCircle, RefreshCw } from "lucide-react";

interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  results?: Array<{
    id: string;
    title: string;
    imageUrl: string;
    platform: {
      name: string;
      dimensions: { width: number; height: number };
    };
    metadata: {
      fileSize: number;
      format: string;
    };
  }>;
  error?: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [items, setItems] = useState<MasonryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/generate/${jobId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch results");
        }

        const job = data.data as JobStatus;

        if (job.status === "completed" && job.results) {
          const masonryItems: MasonryItem[] = job.results.map((result) => ({
            id: result.id,
            title: result.title,
            imageUrl: result.imageUrl,
            platform: {
              name: result.platform.name,
              dimensions: result.platform.dimensions,
            },
            metadata: {
              fileSize: result.metadata.fileSize,
              format: result.metadata.format,
            },
          }));
          setItems(masonryItems);
          setLoading(false);
        } else if (job.status === "failed") {
          setError(job.error || "Generation failed");
          setLoading(false);
        } else {
          // Still processing, poll again
          setTimeout(fetchResults, 1000);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(err instanceof Error ? err.message : "Failed to load results");
        setLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  const handleDownloadAll = () => {
    items.forEach((item) => {
      const a = document.createElement("a");
      a.href = item.imageUrl;
      a.download = `${item.platform.name}_${item.title}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const handleDownload = (item: MasonryItem) => {
    const a = document.createElement("a");
    a.href = item.imageUrl;
    a.download = `${item.platform.name}_${item.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    const shareText = `我使用AI生成了${items.length}个精美封面！`;
    if (navigator.share) {
      navigator.share({
        title: "Cover - AI封面生成器",
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      // Could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">生成失败</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
            <Button onClick={() => router.push("/generate")}>重新开始</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/generate")}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              className="border-slate-200"
            >
              <Download className="w-4 h-4 mr-2" />
              下载全部
            </Button>
            <Button variant="outline" className="border-slate-200" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              分享
            </Button>
          </div>
        </div>
      </header>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <MasonryGrid items={items} onDownload={handleDownload} />
      </div>
    </div>
  );
}
