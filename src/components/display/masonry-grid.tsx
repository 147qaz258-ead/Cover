"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye } from "lucide-react";
import Image from "next/image";

export interface MasonryItem {
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
}

interface MasonryGridProps {
  items: MasonryItem[];
  onDownload?: (item: MasonryItem) => void;
  loading?: boolean;
  className?: string;
}

export function MasonryGrid({
  items,
  onDownload,
  loading = false,
  className,
}: MasonryGridProps) {
  const [visibleItems, setVisibleItems] = useState(9);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleItems((prev) => Math.min(prev + 6, items.length));
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [items.length]);

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted skeleton-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded skeleton-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 skeleton-pulse" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          还没有生成任何封面
        </h3>
        <p className="text-slate-600">
          在上方输入您的内容，AI 将为您生成精美的封面
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6",
        className
      )}
    >
      {items.slice(0, visibleItems).map((item, index) => (
        <div
          key={item.id}
          className="masonry-item masonry-item-enter"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <Card className="group overflow-hidden card-hover border-slate-200/60">
            {/* Image */}
            <div className="relative overflow-hidden bg-slate-100">
              <Image
                src={item.imageUrl}
                alt={item.title}
                width={item.platform.dimensions.width}
                height={item.platform.dimensions.height}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Platform badge */}
              <div className="absolute top-3 left-3">
                <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-0 shadow-sm">
                  {item.platform.name}
                </Badge>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(item.imageUrl, "_blank")}
                  className="bg-white/90 hover:bg-white text-slate-900 border-0 shadow-lg"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {onDownload && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDownload(item)}
                    className="bg-white/90 hover:bg-white text-slate-900 border-0 shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h3 className="font-medium text-slate-900 line-clamp-2 mb-2">
                {item.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{item.metadata.format.toUpperCase()}</span>
                <span>{formatFileSize(item.metadata.fileSize)}</span>
              </div>
            </div>
          </Card>
        </div>
      ))}

      {/* Load more trigger */}
      {visibleItems < items.length && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          <div className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
