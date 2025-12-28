"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoverGenerationResult } from "@/types";
import { getPlatformsByCategory } from "@/lib/platforms/specs";
import { Search, SlidersHorizontal, Filter, X, Grid3X3 } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type SortOption = "platform" | "created" | "size" | "template";
type FilterCategory = "all" | "social" | "ecommerce" | "content";

interface GalleryFilterProps {
  covers: CoverGenerationResult[];
  onFilteredCoversChange?: (covers: CoverGenerationResult[]) => void;
  onSearchChange?: (query: string) => void;
  className?: string;
}

interface FilterState {
  searchQuery: string;
  sortOption: SortOption;
  filterCategory: FilterCategory;
  viewMode: ViewMode;
}

export function useGalleryFilter(covers: CoverGenerationResult[], filterState: FilterState) {
  const { searchQuery, sortOption, filterCategory } = filterState;

  return useMemo(() => {
    let filtered = [...covers];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (cover) =>
          cover.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cover.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cover.platform.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterCategory !== "all") {
      const categoryPlatforms = getPlatformsByCategory(filterCategory);
      const categoryPlatformIds = categoryPlatforms.map((p) => p.id);
      filtered = filtered.filter((cover) =>
        categoryPlatformIds.includes(cover.platform.id)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "platform":
          return a.platform.name.localeCompare(b.platform.name);
        case "created":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "size":
          return b.metadata.fileSize - a.metadata.fileSize;
        case "template":
          return (a.template?.name || "").localeCompare(b.template?.name || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [covers, searchQuery, sortOption, filterCategory]);
}

export function GalleryFilter({
  covers,
  onFilteredCoversChange,
  onSearchChange,
  className,
}: GalleryFilterProps) {
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: "",
    sortOption: "created",
    filterCategory: "all",
    viewMode: "grid",
  });

  const filteredCovers = useGalleryFilter(covers, filterState);

  // Notify parent of filtered results
  useMemo(() => {
    onFilteredCoversChange?.(filteredCovers);
  }, [filteredCovers, onFilteredCoversChange]);

  // Notify parent of search changes
  useMemo(() => {
    onSearchChange?.(filterState.searchQuery);
  }, [filterState.searchQuery, onSearchChange]);

  const clearFilters = () => {
    setFilterState({
      searchQuery: "",
      sortOption: "created",
      filterCategory: "all",
      viewMode: filterState.viewMode,
    });
  };

  const hasActiveFilters = filterState.searchQuery || filterState.filterCategory !== "all";

  // Statistics
  const stats = useMemo(() => {
    const platforms = [...new Set(covers.map((c) => c.platform.name))];
    const templates = [...new Set(covers.map((c) => c.template?.name).filter(Boolean))];
    const totalSize = covers.reduce((sum, c) => sum + c.metadata.fileSize, 0);

    return {
      totalCovers: covers.length,
      filteredCovers: filteredCovers.length,
      platforms: platforms.length,
      templates: templates.length,
      totalSize,
    };
  }, [covers, filteredCovers]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索封面..."
                  value={filterState.searchQuery}
                  onChange={(e) =>
                    setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={filterState.filterCategory}
                onValueChange={(value: FilterCategory) =>
                  setFilterState((prev) => ({ ...prev, filterCategory: value }))
                }
              >
                <SelectTrigger className="w-36">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有平台</SelectItem>
                  <SelectItem value="social">社交媒体</SelectItem>
                  <SelectItem value="ecommerce">电商平台</SelectItem>
                  <SelectItem value="content">内容平台</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterState.sortOption}
                onValueChange={(value: SortOption) =>
                  setFilterState((prev) => ({ ...prev, sortOption: value }))
                }
              >
                <SelectTrigger className="w-32">
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">创建时间</SelectItem>
                  <SelectItem value="platform">平台</SelectItem>
                  <SelectItem value="template">模板</SelectItem>
                  <SelectItem value="size">文件大小</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-1" />
                  清除
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {stats.filteredCovers} / {stats.totalCovers} 个封面
                </span>
              </div>
              <div className="text-muted-foreground">
                {stats.platforms} 个平台 · {stats.templates} 个模板
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              总大小: {formatFileSize(stats.totalSize)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default GalleryFilter;
