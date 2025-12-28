"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Type, ChevronDown, Search } from "lucide-react";

interface FontSelectorProps {
  value?: string;
  onChange?: (font: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  showPreview?: boolean;
  previewText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

interface FontOption {
  family: string;
  category: "serif" | "sans-serif" | "monospace" | "display" | "handwriting";
  name: string;
  variants?: string[];
  preview?: string;
}

const GOOGLE_FONTS: FontOption[] = [
  // Sans-serif
  { family: "Inter", category: "sans-serif", name: "Inter", variants: ["400", "500", "600", "700"] },
  { family: "Roboto", category: "sans-serif", name: "Roboto", variants: ["300", "400", "500", "700"] },
  { family: "Open Sans", category: "sans-serif", name: "Open Sans", variants: ["300", "400", "600", "700"] },
  { family: "Poppins", category: "sans-serif", name: "Poppins", variants: ["300", "400", "500", "600", "700"] },
  { family: "Montserrat", category: "sans-serif", name: "Montserrat", variants: ["300", "400", "500", "600", "700"] },
  { family: "Nunito", category: "sans-serif", name: "Nunito", variants: ["300", "400", "600", "700"] },
  { family: "Raleway", category: "sans-serif", name: "Raleway", variants: ["300", "400", "500", "600", "700"] },
  { family: "Lato", category: "sans-serif", name: "Lato", variants: ["300", "400", "700"] },
  { family: "Rubik", category: "sans-serif", name: "Rubik", variants: ["300", "400", "500", "700"] },
  { family: "Noto Sans", category: "sans-serif", name: "Noto Sans", variants: ["400", "500", "700"] },

  // Serif
  { family: "Playfair Display", category: "serif", name: "Playfair Display", variants: ["400", "500", "600", "700"] },
  { family: "Merriweather", category: "serif", name: "Merriweather", variants: ["300", "400", "700"] },
  { family: "Lora", category: "serif", name: "Lora", variants: ["400", "500", "600", "700"] },
  { family: "Crimson Text", category: "serif", name: "Crimson Text", variants: ["400", "600", "700"] },
  { family: "EB Garamond", category: "serif", name: "EB Garamond", variants: ["400", "500", "600", "700"] },
  { family: "Bitter", category: "serif", name: "Bitter", variants: ["300", "400", "700"] },
  { family: "Cormorant Garamond", category: "serif", name: "Cormorant Garamond", variants: ["300", "400", "500", "600", "700"] },
  { family: "Libre Baskerville", category: "serif", name: "Libre Baskerville", variants: ["400", "700"] },
  { family: "Vollkorn", category: "serif", name: "Vollkorn", variants: ["400", "500", "600", "700"] },
  { family: "Noto Serif", category: "serif", name: "Noto Serif", variants: ["400", "600", "700"] },

  // Display
  { family: "Bebas Neue", category: "display", name: "Bebas Neue", variants: ["400"] },
  { family: "Oswald", category: "display", name: "Oswald", variants: ["300", "400", "500", "600", "700"] },
  { family: "Russo One", category: "display", name: "Russo One", variants: ["400"] },
  { family: "Bangers", category: "display", name: "Bangers", variants: ["400"] },
  { family: "Fredoka One", category: "display", name: "Fredoka One", variants: ["400"] },
  { family: "Lobster", category: "display", name: "Lobster", variants: ["400"] },
  { family: "Pacifico", category: "display", name: "Pacifico", variants: ["400"] },
  { family: "Dancing Script", category: "display", name: "Dancing Script", variants: ["400", "700"] },
  { family: "Permanent Marker", category: "display", name: "Permanent Marker", variants: ["400"] },
  { family: "Shadows Into Light", category: "display", name: "Shadows Into Light", variants: ["400"] },

  // Monospace
  { family: "Fira Code", category: "monospace", name: "Fira Code", variants: ["300", "400", "500", "600", "700"] },
  { family: "JetBrains Mono", category: "monospace", name: "JetBrains Mono", variants: ["300", "400", "500", "600", "700"] },
  { family: "Source Code Pro", category: "monospace", name: "Source Code Pro", variants: ["300", "400", "500", "600", "700"] },
  { family: "IBM Plex Mono", category: "monospace", name: "IBM Plex Mono", variants: ["300", "400", "500", "600", "700"] },
  { family: "Space Mono", category: "monospace", name: "Space Mono", variants: ["400", "700"] },
  { family: "Roboto Mono", category: "monospace", name: "Roboto Mono", variants: ["300", "400", "500", "700"] },

  // Handwriting
  { family: "Indie Flower", category: "handwriting", name: "Indie Flower", variants: ["400"] },
  { family: "Amatic SC", category: "handwriting", name: "Amatic SC", variants: ["400", "700"] },
  { family: "Patrick Hand", category: "handwriting", name: "Patrick Hand", variants: ["400"] },
  { family: "Caveat", category: "handwriting", name: "Caveat", variants: ["400", "500", "600", "700"] },
  { family: "Kalam", category: "handwriting", name: "Kalam", variants: ["300", "400", "700"] },
];

const SYSTEM_FONTS: FontOption[] = [
  { family: "-apple-system, BlinkMacSystemFont", category: "sans-serif", name: "System UI" },
  { family: "Arial, sans-serif", category: "sans-serif", name: "Arial" },
  { family: "Helvetica, sans-serif", category: "sans-serif", name: "Helvetica" },
  { family: "Georgia, serif", category: "serif", name: "Georgia" },
  { family: "Times New Roman, serif", category: "serif", name: "Times New Roman" },
  { family: "Courier New, monospace", category: "monospace", name: "Courier New" },
  { family: "Verdana, sans-serif", category: "sans-serif", name: "Verdana" },
  { family: "Impact, sans-serif", category: "display", name: "Impact" },
];

const CHINESE_FONTS: FontOption[] = [
  { family: "PingFang SC, Microsoft YaHei, sans-serif", category: "sans-serif", name: "苹方/微软雅黑" },
  { family: "Hiragino Sans GB, Microsoft YaHei, sans-serif", category: "sans-serif", name: "冬青黑/微软雅黑" },
  { family: "Microsoft YaHei, sans-serif", category: "sans-serif", name: "微软雅黑" },
  { family: "SimHei, sans-serif", category: "sans-serif", name: "黑体" },
  { family: "SimSun, serif", category: "serif", name: "宋体" },
  { family: "KaiTi, serif", category: "serif", name: "楷体" },
  { family: "FangSong, serif", category: "serif", name: "仿宋" },
  { family: "Microsoft YaHei UI, sans-serif", category: "sans-serif", name: "微软雅黑 UI" },
];

export function FontSelector({
  value = "Inter",
  onChange,
  disabled = false,
  label,
  placeholder = "Select a font",
  showPreview = true,
  previewText = "The quick brown fox jumps over the lazy dog",
  size = "md",
  className,
}: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [fontSize, setFontSize] = useState(24);

  const allFonts = [...GOOGLE_FONTS, ...SYSTEM_FONTS, ...CHINESE_FONTS];

  const filteredFonts = allFonts.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         font.family.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || font.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFontSelect = (font: FontOption) => {
    if (disabled) return;
    onChange?.(font.family);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "text-sm h-8 px-2",
    md: "text-base h-10 px-3",
    lg: "text-lg h-12 px-4",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              sizeClasses[size]
            )}
            disabled={disabled}
          >
            <Type className="w-4 h-4 mr-2" />
            <span className="truncate">{value}</span>
            <ChevronDown className="w-4 h-4 ml-auto" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0">
              {/* Search and Filters */}
              <div className="p-3 border-b space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search fonts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="sans-serif">Sans-serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="display">Display</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                    <SelectItem value="handwriting">Handwriting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredFonts.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No fonts found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredFonts.map((font) => (
                      <button
                        key={font.family}
                        className={cn(
                          "w-full p-3 text-left hover:bg-accent transition-colors",
                          value === font.family && "bg-accent"
                        )}
                        onClick={() => handleFontSelect(font)}
                        disabled={disabled}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{font.name}</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {font.category}
                          </span>
                        </div>
                        {showPreview && (
                          <div
                            className="text-sm text-muted-foreground truncate"
                            style={{
                              fontFamily: font.family,
                              fontSize: Math.min(fontSize, 16) + "px",
                            }}
                          >
                            {font.preview || previewText}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview Controls */}
              {showPreview && (
                <div className="p-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Preview Size</Label>
                    <span className="text-sm text-muted-foreground">{fontSize}px</span>
                  </div>
                  <Slider
                    value={[fontSize]}
                    onValueChange={([value]) => setFontSize(value)}
                    min={12}
                    max={48}
                    step={1}
                    className="w-full"
                  />
                  <div
                    className="p-3 bg-muted rounded text-center"
                    style={{
                      fontFamily: value,
                      fontSize: fontSize + "px",
                    }}
                  >
                    {previewText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default FontSelector;