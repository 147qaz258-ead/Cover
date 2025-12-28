"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Filter, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasonryGrid } from "@/components/gallery/masonry-grid";
import { CoverGenerationResult } from "@/types";
import { toast } from "sonner";

const STORAGE_KEY = "cover_generation_history";

export default function GalleryPage() {
  const router = useRouter();
  const [items, setItems] = useState<CoverGenerationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  useEffect(() => {
    loadGalleryItems();
  }, [selectedPlatform]);

  const loadGalleryItems = () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        let historyItems: CoverGenerationResult[] = JSON.parse(stored);

        // Filter by platform if selected
        if (selectedPlatform !== "all") {
          historyItems = historyItems.filter((item) => item.platform.id === selectedPlatform);
        }

        // Sort by createdAt descending
        historyItems.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setItems(historyItems);
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Failed to load gallery:", error);
      toast.error("加载作品库失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (item: CoverGenerationResult) => {
    const a = document.createElement("a");
    a.href = item.imageUrl;
    a.download = `${item.platform.name}_${item.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("下载成功");
  };

  const handlePreview = (item: CoverGenerationResult) => {
    // Open in lightbox (will be handled by the lightbox component integration)
    window.open(item.imageUrl, "_blank");
  };

  const handleReEdit = (item: CoverGenerationResult) => {
    sessionStorage.setItem("re-edit-item", JSON.stringify(item));
    router.push("/generate");
  };

  const handleDelete = (id: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let history: CoverGenerationResult[] = stored ? JSON.parse(stored) : [];
      history = history.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      setItems(items.filter((item) => item.id !== id));
      toast.success("删除成功");
    } catch (error) {
      toast.error("删除失败");
    }
  };

  // Empty state
  if (!loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/generate">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  返回
                </Button>
              </Link>
              <div className="h-4 w-px bg-slate-200" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h1 className="text-lg font-semibold text-slate-900">我的作品</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Empty State */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Grid className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2">
              还没有生成任何封面
            </h2>
            <p className="text-slate-600 mb-6">
              开始创建您的第一个 AI 封面吧！
            </p>
            <Button asChild>
              <Link href="/generate">
                <Sparkles className="w-4 h-4 mr-2" />
                开始生成
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/generate">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              <h1 className="text-lg font-semibold text-slate-900">我的作品</h1>
            </div>
          </div>

          {/* Platform Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="text-sm border-0 bg-transparent text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="all">全部平台</option>
              <option value="xiaohongshu">小红书</option>
              <option value="wechat">微信</option>
              <option value="douyin">抖音</option>
              <option value="taobao">淘宝</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                共 <span className="font-semibold text-slate-900">{items.length}</span> 个作品
              </p>
            </div>

            {/* Masonry Grid */}
            <MasonryGrid
              items={items}
              onDownload={handleDownload}
              onPreview={handlePreview}
              onEdit={handleReEdit}
              enableFilters={false}
              enableSelection={true}
            />
          </>
        )}
      </main>
    </div>
  );
}
