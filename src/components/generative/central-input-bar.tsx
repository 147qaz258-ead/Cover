"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CentralInputBarProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  placeholder?: string;
  minLength?: number;
}

export function CentralInputBar({
  onSubmit,
  loading = false,
  placeholder = "输入您的文章内容，AI 将为您生成精美的社交媒体封面...",
  minLength = 10,
}: CentralInputBarProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const isValid = text.trim().length >= minLength;

  const handleSubmit = () => {
    if (isValid && !loading) {
      onSubmit(text.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        "w-full transition-all duration-300",
        isFocused && "transform scale-[1.01]"
      )}
    >
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-lg border transition-all duration-300",
          isFocused
            ? "shadow-xl border-violet-300 ring-4 ring-violet-500/10"
            : "border-slate-200"
        )}
      >
        {/* Input Area */}
        <div className="p-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            className={cn(
              "min-h-[120px] resize-none text-base border-0 p-0 focus-visible:ring-0 focus-visible:shadow-none",
              "placeholder:text-slate-400"
            )}
          />

          {/* Helper text */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-500">
              {text.length < minLength ? (
                <>
                  至少输入 {minLength} 个字符 (当前: {text.length})
                </>
              ) : (
                <span className="text-green-600">
                  可以生成 (按 Cmd/Ctrl + Enter)
                </span>
              )}
            </p>

            <Button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              size="lg"
              className={cn(
                "h-12 px-6 font-medium shadow-md transition-all duration-200",
                "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  生成封面
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Quick options below input */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm text-slate-500">常用:</span>
        {["小红书", "微信", "抖音", "淘宝"].map((label) => (
          <button
            key={label}
            onClick={() => setText((prev) => prev + ` ${label}`)}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
