"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useContentModeration, getModerationErrorMessage } from "@/hooks/use-content-moderation";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  mobile?: boolean;
}

export function TextInput({
  value,
  onChange,
  onSubmit,
  placeholder = "请输入您想要生成封面的文章内容...",
  maxLength = 10000,
  disabled = false,
  mobile = false,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showModerationWarning, setShowModerationWarning] = useState(false);
  const characterCount = value.length;
  const remainingCharacters = maxLength - characterCount;

  // Content moderation
  const {
    isLoading: isModerating,
    lastResult,
    error: moderationError,
    isFlagged,
    flaggedCategories,
    generateAlternative,
  } = useContentModeration({
    enabled: value.length > 50,
    debounceMs: 1000,
  });

  // Debounced moderation
  useEffect(() => {
    if (value.length > 50) {
      const timeoutId = setTimeout(() => {
        setShowModerationWarning(isFlagged);
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      setShowModerationWarning(false);
    }
  }, [isFlagged, value.length]);

  const handleGenerateAlternative = async () => {
    const alternative = await generateAlternative(value);
    if (alternative) {
      onChange(alternative);
      setShowModerationWarning(false);
    }
  };

  const getCharacterCountColor = () => {
    if (remainingCharacters < 100) return "text-destructive";
    if (remainingCharacters < 500) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getWordCount = () => {
    // Count Chinese characters and English words
    const chineseChars = (value.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (value.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  };

  return (
    <Card className="w-full">
      <CardContent className={mobile ? "p-4" : "p-6"}>
        <div className="space-y-4">
          {/* Content moderation warning */}
          {showModerationWarning && isFlagged && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    内容检测提醒
                  </p>
                  <p className="text-orange-700 dark:text-orange-300">
                    您的内容可能包含敏感信息: {getModerationErrorMessage(lastResult!, { showCategories: true })}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateAlternative}
                      disabled={isModerating}
                      className="text-orange-700 border-orange-300 hover:bg-orange-100"
                    >
                      {isModerating ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        "生成安全版本"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowModerationWarning(false)}
                      className="text-orange-700 hover:bg-orange-100"
                    >
                      了解更多
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="text-sm font-medium">文章内容</label>
              <p className="text-xs text-muted-foreground">
                输入您想要生成封面的文章内容，AI将自动分析并生成合适的标题和图片
              </p>
            </div>
            {value.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="outline">
                  {getWordCount()} 字
                </Badge>
                <Badge variant="outline">
                  {characterCount.toLocaleString()} 字符
                </Badge>
                {isModerating && (
                  <Badge variant="secondary" className="animate-pulse">
                    检测中
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              className={`min-h-[200px] resize-none transition-colors ${
                isFocused ? "ring-2 ring-ring ring-offset-2" : ""
              }`}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />

            {!isFocused && value.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-2 p-4 bg-background/80 rounded-md">
                  <div className="text-2xl">📝</div>
                  <div className="text-sm text-muted-foreground">
                    粘贴或输入您的文章内容
                  </div>
                  <div className="text-xs text-muted-foreground">
                    支持10,000字符以内
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className={`text-sm ${getCharacterCountColor()}`}>
              {remainingCharacters.toLocaleString()} 字符剩余
            </div>

            <div className="flex gap-2">
              {value.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onChange("")}
                  disabled={disabled}
                >
                  清空
                </Button>
              )}
              <Button
                onClick={onSubmit}
                disabled={!value.trim() || value.length < 10 || disabled}
                className="min-w-[100px]"
              >
                生成封面
              </Button>
            </div>
          </div>

          {value.length > 0 && value.length < 10 && (
            <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md">
              ⚠️ 内容太短，请至少输入10个字符以获得更好的生成效果
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}