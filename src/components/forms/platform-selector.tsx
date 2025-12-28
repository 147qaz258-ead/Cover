"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Platform } from "@/types";
import { PLATFORMS } from "@/lib/platforms/specs";
import { cn } from "@/lib/utils";

interface PlatformSelectorProps {
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  disabled?: boolean;
}

export function PlatformSelector({
  selectedPlatforms,
  onPlatformsChange,
  disabled = false,
}: PlatformSelectorProps) {
  // 单选模式：点击其他平台时直接替换当前选择
  const togglePlatform = (platformId: string) => {
    // 如果点击的是已选中的平台，不做任何操作（保持选中）
    if (selectedPlatforms.includes(platformId)) {
      return;
    }
    // 否则替换为新平台（单选）
    onPlatformsChange([platformId]);
  };

  const selectAll = () => {
    onPlatformsChange(PLATFORMS.map(p => p.id));
  };

  const clearAll = () => {
    onPlatformsChange([]);
  };

  const groupedPlatforms = {
    social: PLATFORMS.filter(p =>
      ["xiaohongshu", "douyin", "weibo"].includes(p.id)
    ),
    content: PLATFORMS.filter(p =>
      ["wechat", "wechat-banner", "bilibili", "zhihu"].includes(p.id)
    ),
    ecommerce: PLATFORMS.filter(p =>
      ["taobao", "taobao-banner"].includes(p.id)
    ),
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>选择平台</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={disabled || selectedPlatforms.length === 0}
            >
              清除
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
              disabled={disabled || selectedPlatforms.length === PLATFORMS.length}
            >
              全选
            </Button>
          </div>
        </CardTitle>
        {selectedPlatforms.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedPlatforms.map(platformId => {
              const platform = PLATFORMS.find(p => p.id === platformId);
              return platform ? (
                <Badge key={platformId} variant="secondary">
                  {platform.name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedPlatforms).map(([category, platforms]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium">
              {category === "social" && "社交媒体"}
              {category === "content" && "内容平台"}
              {category === "ecommerce" && "电商平台"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {platforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    disabled={disabled}
                    className={cn(
                      "group relative rounded-lg border-2 p-4 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="space-y-2">
                      {/* Platform Icon/Visual */}
                      <div className="flex justify-center">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            backgroundColor: isSelected ? "hsl(var(--primary))" : platform.id === "xiaohongshu" ? "#ff2442" :
                              platform.id === "douyin" ? "#000000" :
                                platform.id === "wechat" ? "#07c160" :
                                  platform.id === "weibo" ? "#e6162d" :
                                    platform.id === "taobao" ? "#ff6000" :
                                      platform.id === "bilibili" ? "#00a1d6" :
                                        platform.id === "zhihu" ? "#0084ff" : "hsl(var(--muted))"
                          }}
                        >
                          {platform.name.substring(0, 2)}
                        </div>
                      </div>

                      {/* Platform Info */}
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{platform.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {platform.dimensions.width} × {platform.dimensions.height}
                        </div>
                        <div className="flex gap-1 justify-center">
                          {platform.supportedFormats.map(format => (
                            <Badge
                              key={format}
                              variant="outline"
                              className="text-[10px] px-1 py-0 h-4"
                            >
                              {format.toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Selection Tips */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md space-y-1">
          <div>💡 选择您想要生成封面的平台</div>
          <div>• 每个平台将生成适配其尺寸比例的封面</div>
          <div>• 支持多平台同时生成，提高效率</div>
        </div>

        {/* No Selection Warning */}
        {selectedPlatforms.length === 0 && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              请至少选择一个平台来生成封面
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}