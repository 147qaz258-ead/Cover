"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CoverGenerationResult } from "@/types";
import { Download, Eye, Edit2, Grid, List } from "lucide-react";
import Image from "next/image";
import { GalleryFilter, useGalleryFilter } from "./gallery-filter";

export interface MasonryGridProps {
  items: CoverGenerationResult[];
  onDownload?: (item: CoverGenerationResult) => void;
  onEdit?: (item: CoverGenerationResult) => void;
  onPreview?: (item: CoverGenerationResult) => void;
  loading?: boolean;
  enableFilters?: boolean;
  enableSelection?: boolean;
  className?: string;
}

type ViewMode = "grid" | "list" | "masonry";

export function MasonryGrid({
  items,
  onDownload,
  onEdit,
  onPreview,
  loading = false,
  enableFilters = true,
  enableSelection = true,
  className,
}: MasonryGridProps) {
  const [visibleItems, setVisibleItems] = useState(12);
  const [viewMode, setViewMode] = useState<ViewMode>("masonry");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "social" | "ecommerce" | "content">("all");
  const [sortOption, setSortOption] = useState<"platform" | "created" | "size" | "template">("created");

  // Apply filters
  const filteredItems = useGalleryFilter(items, {
    searchQuery,
    sortOption,
    filterCategory,
    viewMode: "grid",
  });

  // Infinite scroll
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleItems((prev) => Math.min(prev + 8, filteredItems.length));
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [filteredItems.length]);

  // Reset visible items when filter changes
  useEffect(() => {
    setVisibleItems(12);
    setSelectedIds([]);
  }, [searchQuery, filterCategory, sortOption]);

  const formatFileSize = (bytes: number) => {
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const handleToggleSelection = (itemId: string) => {
    setSelectedIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleBatchDownload = () => {
    const selected = filteredItems.filter((item) => selectedIds.includes(item.id));
    selected.forEach((item) => onDownload?.(item));
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="aspect-square bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
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

  // No results for filter
  if (filteredItems.length === 0) {
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          没有找到匹配的封面
        </h3>
        <p className="text-slate-600">
          尝试调整搜索关键词或筛选条件
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setSearchQuery("");
            setFilterCategory("all");
          }}
        >
          清除筛选条件
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Filters */}
      {enableFilters && (
        <>
          <GalleryFilter
            covers={items}
            onSearchChange={setSearchQuery}
            className="mb-6"
          />

          {/* View Mode Toggle & Selection Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center border rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "masonry" ? "default" : "ghost"}
                  onClick={() => setViewMode("masonry")}
                  className="rounded-l-none rounded-r-none"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="9" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {enableSelection && selectedIds.length > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedIds.length} 已选择
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                  >
                    {selectedIds.length === filteredItems.length ? "取消全选" : "全选"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchDownload}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    批量下载
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.slice(0, visibleItems).map((item) => {
            const isSelected = selectedIds.includes(item.id);

            return (
              <Card
                key={item.id}
                className={cn(
                  "group overflow-hidden cursor-pointer transition-all hover:shadow-lg",
                  isSelected && "ring-2 ring-yellow-400 ring-offset-2"
                )}
              >
                {/* Selection Checkbox */}
                {enableSelection && (
                  <div
                    className={cn(
                      "absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-yellow-400 border-yellow-400"
                        : "bg-white/90 border-gray-300"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelection(item.id);
                    }}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-sm bg-yellow-900" />
                    )}
                  </div>
                )}

                {/* Image */}
                <div className="relative aspect-square bg-slate-100 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={item.platform.dimensions.width}
                    height={item.platform.dimensions.height}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Platform Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-0 shadow-sm">
                      {item.platform.name}
                    </Badge>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4 gap-2">
                    {onPreview && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onPreview(item)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(item)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onDownload && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onDownload(item)}
                        className="bg-white/90 hover:bg-white"
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
                    <span>{item.template?.name || "默认模板"}</span>
                    <span>{formatFileSize(item.metadata.fileSize)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Masonry */}
      {viewMode === "masonry" && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {filteredItems.slice(0, visibleItems).map((item, index) => (
            <div
              key={item.id}
              className="masonry-item masonry-item-enter break-inside-avoid"
              style={{ animationDelay: `${index * 30}ms` }}
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

                  {/* Platform Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-0 shadow-sm">
                      {item.platform.name}
                    </Badge>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-6 gap-2">
                    {onPreview && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onPreview(item)}
                        className="bg-white/90 hover:bg-white text-slate-900 border-0 shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(item)}
                        className="bg-white/90 hover:bg-white text-slate-900 border-0 shadow-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
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
                  {item.subtitle && (
                    <p className="text-sm text-slate-600 line-clamp-1 mb-2">
                      {item.subtitle}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{item.template?.name || "默认模板"}</span>
                    <span>{formatFileSize(item.metadata.fileSize)}</span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {filteredItems.slice(0, visibleItems).map((item) => (
            <Card
              key={item.id}
              className={cn(
                "group hover:shadow-md transition-all",
                enableSelection && selectedIds.includes(item.id) && "ring-2 ring-yellow-400"
              )}
            >
              <div className="flex">
                <div className="relative w-32 h-32 md:w-48 md:h-32 flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={item.platform.dimensions.width}
                    height={item.platform.dimensions.height}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900 mb-1">{item.title}</h3>
                        {item.subtitle && (
                          <p className="text-sm text-slate-600 line-clamp-1">{item.subtitle}</p>
                        )}
                      </div>
                      <Badge className="shrink-0">{item.platform.name}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span>{item.template?.name || "默认模板"}</span>
                      <span className="mx-2">•</span>
                      <span>{formatFileSize(item.metadata.fileSize)}</span>
                    </div>
                    <div className="flex gap-2">
                      {onPreview && (
                        <Button size="sm" variant="ghost" onClick={() => onPreview(item)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button size="sm" variant="ghost" onClick={() => onEdit(item)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      {onDownload && (
                        <Button size="sm" variant="ghost" onClick={() => onDownload(item)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {visibleItems < filteredItems.length && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-yellow-200 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default MasonryGrid;
