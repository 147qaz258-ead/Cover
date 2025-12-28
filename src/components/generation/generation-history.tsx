"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoverGenerationResult } from "@/types";
import { Clock, Edit2, Trash2, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ImageLightbox } from "@/components/covers/image-lightbox";

interface GenerationHistoryProps {
  onReEdit?: (item: CoverGenerationResult) => void;
  onPreview?: (item: CoverGenerationResult) => void;
  onDelete?: (id: string) => void;
  maxItems?: number;
  className?: string;
}

const STORAGE_KEY = "cover_generation_history";

export function GenerationHistory({
  onReEdit,
  onPreview,
  onDelete,
  maxItems = 10,
  className,
}: GenerationHistoryProps) {
  const [history, setHistory] = useState<CoverGenerationResult[]>([]);
  const [expanded, setExpanded] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: CoverGenerationResult[] = JSON.parse(stored);
        // Sort by createdAt descending
        items.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        setHistory(items);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  }, []);

  // Extract all image URLs for lightbox
  const allImages = history.map((item) => item.imageUrl);

  const handlePreviewClick = (item: CoverGenerationResult, index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    // Also call the external onPreview if provided
    onPreview?.(item);
  };

  const handleDelete = (id: string) => {
    const newHistory = history.filter((item) => item.id !== id);
    setHistory(newHistory);
    // Update localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    onDelete?.(id);
  };

  const handleDownload = async (item: CoverGenerationResult) => {
    try {
      // 使用 fetch + Blob 方式强制下载
      const response = await fetch(item.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.platform.name}_${item.title}.webp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // 释放 Blob URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // 降级：直接打开链接
      window.open(item.imageUrl, "_blank");
    }
  };

  const displayItems = expanded ? history : history.slice(0, 5);

  // Empty state
  if (history.length === 0) {
    return (
      <Card className={cn("border-dashed border-slate-300", className)}>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">暂无生成历史</p>
            <p className="text-xs mt-1">生成的封面将保存在这里</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">生成历史</h3>
          <Badge variant="secondary" className="text-xs">
            {history.length} 条记录
          </Badge>
        </div>
        {history.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-600"
          >
            {expanded ? "收起" : "查看全部"}
          </Button>
        )}
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {displayItems.map((item) => (
          <Card
            key={item.id}
            className="group hover:shadow-md transition-shadow border-slate-200"
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    <Badge className="text-[10px] px-1 py-0 bg-white/90 backdrop-blur">
                      {item.platform.name}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate mb-1">
                    {item.title}
                  </h4>
                  {item.subtitle && (
                    <p className="text-sm text-slate-600 truncate mb-2">
                      {item.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      {item.createdAt &&
                        formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                    </span>
                    <span>·</span>
                    <span>{item.template?.name || "默认模板"}</span>
                    <span>·</span>
                    <span>{formatFileSize(item.metadata.fileSize)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handlePreviewClick(item, displayItems.indexOf(item))}
                    title="预览"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {onReEdit && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onReEdit(item)}
                      title="重新编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(item)}
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      title="删除"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setLightboxIndex}
        items={history}
      />
    </div>
  );
}

// Helper function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper function to save new generation result
export function saveToHistory(item: CoverGenerationResult): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let history: CoverGenerationResult[] = stored ? JSON.parse(stored) : [];

    // Add new item
    history.push(item);

    // Keep only last 50 items
    if (history.length > 50) {
      history = history.slice(-50);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save to history:", error);
  }
}

// Helper function to clear history
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export default GenerationHistory;
