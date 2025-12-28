"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CoverGenerationResult } from "@/types";
import { Download, CheckCircle, Trash2, Edit2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface GalleryActionsProps {
  covers: CoverGenerationResult[];
  selectedIds: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onDownload?: (covers: CoverGenerationResult[]) => void;
  onEdit?: (cover: CoverGenerationResult) => void;
  onPreview?: (cover: CoverGenerationResult) => void;
  onDelete?: (covers: CoverGenerationResult[]) => void;
  showSelection?: boolean;
  className?: string;
}

export function GalleryActions({
  covers,
  selectedIds,
  onSelectionChange,
  onDownload,
  onEdit,
  onPreview,
  onDelete,
  showSelection = true,
  className,
}: GalleryActionsProps) {
  const [isAllSelected, setIsAllSelected] = useState(false);

  const selectedCovers = covers.filter((c) => selectedIds.includes(c.id));

  const handleSelectAll = () => {
    const newState = !isAllSelected;
    setIsAllSelected(newState);
    onSelectionChange?.(newState ? covers.map((c) => c.id) : []);
  };

  const handleToggleSelection = (coverId: string) => {
    const newSelection = selectedIds.includes(coverId)
      ? selectedIds.filter((id) => id !== coverId)
      : [...selectedIds, coverId];
    onSelectionChange?.(newSelection);
    setIsAllSelected(newSelection.length === covers.length);
  };

  const handleBatchDownload = () => {
    if (selectedCovers.length > 0) {
      onDownload?.(selectedCovers);
    }
  };

  const handleBatchDelete = () => {
    if (selectedCovers.length > 0) {
      onDelete?.(selectedCovers);
      onSelectionChange?.([]);
      setIsAllSelected(false);
    }
  };

  const handleSingleDownload = (cover: CoverGenerationResult) => {
    onDownload?.([cover]);
  };

  if (covers.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Action Bar */}
      {showSelection && (selectedIds.length > 0 || isAllSelected) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-yellow-200 text-yellow-900 border-yellow-300">
                  {selectedIds.length} 已选择
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSelectAll}
                  className="text-yellow-900 border-yellow-300 hover:bg-yellow-100"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {isAllSelected ? "取消全选" : "全选"}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleBatchDownload}
                  className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
                >
                  <Download className="w-4 h-4 mr-1" />
                  批量下载 ({selectedIds.length})
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cover Grid with Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {covers.map((cover) => {
          const isSelected = selectedIds.includes(cover.id);

          return (
            <div
              key={cover.id}
              className={cn(
                "relative group cursor-pointer rounded-lg overflow-hidden transition-all",
                isSelected && "ring-2 ring-yellow-400 ring-offset-2"
              )}
              onClick={() => showSelection && handleToggleSelection(cover.id)}
            >
              {/* Selection Checkbox */}
              {showSelection && (
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-yellow-400 border-yellow-400"
                        : "bg-white/90 border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <CheckCircle className="w-3 h-3 text-yellow-900" />
                    )}
                  </div>
                </div>
              )}

              {/* Cover Image */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img
                  src={cover.imageUrl}
                  alt={cover.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />

                {/* Platform Badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/90 text-slate-900 backdrop-blur-sm border-0 shadow-sm text-xs">
                    {cover.platform.name}
                  </Badge>
                </div>

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  {onPreview && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreview(cover);
                      }}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(cover);
                      }}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSingleDownload(cover);
                    }}
                    className="bg-white/90 hover:bg-white"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-white p-3 border-t">
                <h3 className="font-medium text-sm line-clamp-1">{cover.title}</h3>
                {cover.subtitle && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {cover.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GalleryActions;
