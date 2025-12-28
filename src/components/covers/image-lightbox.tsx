"use client";

import { Lightbox } from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Download, Copy, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CoverGenerationResult } from "@/types";
import { copyImageAndText } from "@/lib/utils/clipboard";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  items?: CoverGenerationResult[]; // Optional: full item data for actions
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onIndexChange,
  items,
}: ImageLightboxProps) {
  const handleDownload = async () => {
    const imageUrl = images[currentIndex];
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-${currentIndex + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("下载成功");
    } catch (error) {
      toast.error("下载失败");
    }
  };

  const handleCopy = async () => {
    const item = items?.[currentIndex];
    if (!item) {
      toast.error("无法复制：缺少数据");
      return;
    }

    const text = `${item.title}\n${item.subtitle || ""}`;
    const result = await copyImageAndText(item.imageUrl, text, item.title);

    if (result.success) {
      toast.success("已复制到剪贴板");
    } else {
      toast.error("复制失败，请手动下载");
    }
  };

  const handleReEdit = () => {
    const item = items?.[currentIndex];
    if (!item) {
      toast.error("无法编辑：缺少数据");
      return;
    }

    // Store full item in sessionStorage for re-edit
    sessionStorage.setItem("re-edit-item", JSON.stringify(item));
    window.location.href = "/generate";
  };

  // Convert images to Lightbox slides format
  const slides = images.map((src) => ({ src }));

  return (
    <div style={{ position: "relative" }}>
      <Lightbox
        open={isOpen}
        close={onClose}
        index={currentIndex}
        slides={slides}
        on={{
          view: ({ index }) => onIndexChange(index),
        }}
        carousel={{
          finite: true,
        }}
      />
      {/* Custom action buttons overlay */}
      {isOpen && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 z-[9999]"
          style={{ pointerEvents: "auto" }}
        >
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-white hover:text-white hover:bg-white/20"
          >
            <Download className="w-5 h-5" />
          </Button>
          {items && items[currentIndex] && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <Copy className="w-5 h-5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReEdit}
                className="text-white hover:text-white hover:bg-white/20"
              >
                <Edit2 className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default ImageLightbox;
