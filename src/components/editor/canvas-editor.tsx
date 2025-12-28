"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { TextPositioningManager, TextElement } from "@/lib/canvas/text-positioning";
import { CoverCustomizations, Platform } from "@/types";
import { Canvas, FabricImage, Line, TPointerEventInfo, TPointerEvent, Point } from "fabric";
import { CanvasErrorBoundary } from "@/components/ui/error-boundary";
import { cn } from "@/lib/utils";
import {
  ZoomIn,
  ZoomOut,
  Move,
  Type,
  Download,
  Undo,
  Redo,
  RotateCw,
  Lock,
  Unlock,
  Grid3x3,
  Maximize2,
  Save,
  FileImage,
  Palette,
} from "lucide-react";

interface CanvasEditorProps {
  platform: Platform;
  initialImage?: string;
  initialTexts?: TextElement[];
  customizations?: CoverCustomizations;
  onSave?: (dataUrl: string, texts: TextElement[]) => void;
  onExport?: (dataUrl: string) => void;
  onTextChange?: (texts: TextElement[]) => void;
  className?: string;
}

interface ToolbarAction {
  icon: React.ElementType;
  label: string;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
}

export function CanvasEditor({
  platform,
  initialImage,
  initialTexts = [],
  customizations,
  onSave,
  onExport,
  onTextChange,
  className,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<Canvas | null>(null);
  const [positionManager, setPositionManager] = useState<TextPositioningManager | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<"select" | "text" | "pan">("select");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentText, setCurrentText] = useState("");
  const [selectedFontSize, setSelectedFontSize] = useState(32);
  const [selectedFontFamily, setSelectedFontFamily] = useState("Inter");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedWeight, setSelectedWeight] = useState<"normal" | "bold" | "light" | "medium">("normal");
  const [selectedAlign, setSelectedAlign] = useState<"left" | "center" | "right">("left");
  const [isAddingText, setIsAddingText] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: platform.dimensions.width,
      height: platform.dimensions.height,
      backgroundColor: customizations?.backgroundColor || "#ffffff",
    });

    // Load initial image if provided
    if (initialImage) {
      FabricImage.fromURL(initialImage).then((img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          canvas.width! / img.width!,
          canvas.height! / img.height!
        );
        img.scale(scale);
        img.set({
          left: (canvas.width! - img.width! * scale) / 2,
          top: (canvas.height! - img.height! * scale) / 2,
          selectable: false,
          evented: false,
        });
        canvas.add(img);
        canvas.sendObjectToBack(img);
      });
    }

    setFabricCanvas(canvas);

    // Initialize positioning manager
    const manager = new TextPositioningManager(canvas, {
      snapToGrid,
      gridSize: 20,
      showBoundingBox: true,
      lockAspectRatio,
      constrainToCanvas: true,
      multiSelect: true,
    });
    setPositionManager(manager);

    // Load initial texts
    initialTexts.forEach((text) => {
      manager.addText(text);
    });

    // Save initial state
    saveToHistory();

    // Cleanup
    return () => {
      manager.destroy();
      canvas.dispose();
    };
  }, [platform, initialImage, initialTexts]);

  // Update positioning options
  useEffect(() => {
    if (positionManager) {
      positionManager.updateOptions({
        snapToGrid,
        lockAspectRatio,
      });
    }
  }, [positionManager, snapToGrid, lockAspectRatio]);

  // Update grid display
  useEffect(() => {
    if (!fabricCanvas) return;

    if (showGrid) {
      const gridSize = 20;
      const gridLines: Line[] = [];

      // Vertical lines
      for (let x = 0; x <= fabricCanvas.width!; x += gridSize) {
        gridLines.push(
          new Line([x, 0, x, fabricCanvas.height!], {
            stroke: "#e0e0e0",
            selectable: false,
            evented: false,
            strokeDashArray: [2, 2],
          })
        );
      }

      // Horizontal lines
      for (let y = 0; y <= fabricCanvas.height!; y += gridSize) {
        gridLines.push(
          new Line([0, y, fabricCanvas.width!, y], {
            stroke: "#e0e0e0",
            selectable: false,
            evented: false,
            strokeDashArray: [2, 2],
          })
        );
      }

      gridLines.forEach((line) => fabricCanvas.add(line));
      fabricCanvas.renderAll();
    } else {
      // Remove grid lines
      const objects = fabricCanvas.getObjects();
      const gridLines = objects.filter((obj) =>
        obj.type === "line" && (obj as Line).stroke === "#e0e0e0"
      );
      gridLines.forEach((line) => fabricCanvas.remove(line));
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, showGrid]);

  // Text change handler
  useEffect(() => {
    if (positionManager && onTextChange) {
      const texts = positionManager.getAllTexts();
      onTextChange(texts);
    }
  }, [positionManager, onTextChange]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: TPointerEventInfo<TPointerEvent>) => {
    if (selectedTool === "text" && !e.target) {
      const pointer = fabricCanvas!.getPointer(e.e);
      addNewText(pointer.x, pointer.y);
    }
  }, [fabricCanvas, selectedTool]);

  // Setup canvas event listeners
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.on("mouse:down", handleCanvasClick);

    return () => {
      fabricCanvas.off("mouse:down", handleCanvasClick);
    };
  }, [fabricCanvas, handleCanvasClick]);

  // Add new text element
  const addNewText = (x: number, y: number) => {
    if (!positionManager || !currentText) return;

    const textElement: TextElement = {
      id: `text_${Date.now()}`,
      text: currentText,
      x,
      y,
      fontSize: selectedFontSize,
      fontFamily: selectedFontFamily,
      fontWeight: selectedWeight,
      color: selectedColor,
      textAlign: selectedAlign,
    };

    positionManager.addText(textElement);
    saveToHistory();
    setIsAddingText(false);
    setCurrentText("");
  };

  // History management
  const saveToHistory = () => {
    if (!fabricCanvas) return;

    const json = fabricCanvas.toJSON();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(json));

    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      positionManager?.loadFromJSON(JSON.parse(history[newIndex]));
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      positionManager?.loadFromJSON(JSON.parse(history[newIndex]));
    }
  };

  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(zoom * 1.2, 3);
    setZoom(newZoom);
    fabricCanvas?.setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(zoom / 1.2, 0.5);
    setZoom(newZoom);
    fabricCanvas?.setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(1);
    fabricCanvas?.setZoom(1);
    fabricCanvas?.absolutePan(new Point(0, 0));
  };

  // Export canvas
  const handleExport = (format: "png" | "jpeg" | "webp" = "png") => {
    if (!fabricCanvas) return;

    const dataURL = fabricCanvas.toDataURL({
      format,
      quality: format === "jpeg" ? 0.9 : 1,
      multiplier: 2, // Higher resolution
    });

    onExport?.(dataURL);
  };

  // Save canvas state
  const handleSave = () => {
    if (!fabricCanvas || !positionManager) return;

    const dataURL = fabricCanvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    const texts = positionManager.getAllTexts();
    onSave?.(dataURL, texts);
  };

  // Toolbar actions
  const toolbarActions: ToolbarAction[] = [
    {
      icon: Type,
      label: "Add Text",
      action: () => {
        setSelectedTool("text");
        setIsAddingText(true);
      },
      active: selectedTool === "text",
    },
    {
      icon: Move,
      label: "Pan",
      action: () => setSelectedTool("pan"),
      active: selectedTool === "pan",
    },
    {
      icon: Undo,
      label: "Undo",
      action: undo,
      disabled: historyIndex <= 0,
    },
    {
      icon: Redo,
      label: "Redo",
      action: redo,
      disabled: historyIndex >= history.length - 1,
    },
    {
      icon: ZoomIn,
      label: "Zoom In",
      action: zoomIn,
    },
    {
      icon: ZoomOut,
      label: "Zoom Out",
      action: zoomOut,
    },
    {
      icon: Maximize2,
      label: "Reset Zoom",
      action: resetZoom,
    },
  ];

  return (
    <CanvasErrorBoundary>
      <div className={cn("flex flex-col h-full", className)}>
        {/* Toolbar */}
        <Card className="flex-shrink-0">
          <CardContent className="p-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tools */}
              <div className="flex items-center gap-1 border-r pr-2">
                {toolbarActions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.active ? "default" : "ghost"}
                    onClick={action.action}
                    disabled={action.disabled}
                    title={action.label}
                  >
                    <action.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>

              {/* Text controls (when adding text) */}
              {isAddingText && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Enter text..."
                      value={currentText}
                      onChange={(e) => setCurrentText(e.target.value)}
                      className="w-48"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => setIsAddingText(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {/* Options */}
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch
                    id="snap-grid"
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                  <Label htmlFor="snap-grid" className="text-sm">Snap</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-grid"
                    checked={showGrid}
                    onCheckedChange={setShowGrid}
                  />
                  <Label htmlFor="show-grid" className="text-sm">Grid</Label>
                </div>
                <div className="flex items-center gap-2">
                  {lockAspectRatio ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Unlock className="w-4 h-4" />
                  )}
                  <Switch
                    id="lock-aspect"
                    checked={lockAspectRatio}
                    onCheckedChange={setLockAspectRatio}
                  />
                  <Label htmlFor="lock-aspect" className="text-sm">Lock</Label>
                </div>
              </div>

              {/* Export */}
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Select onValueChange={(value: "png" | "jpeg" | "webp") => handleExport(value)}>
                  <SelectTrigger className="w-24">
                    <FileImage className="w-4 h-4 mr-1" />
                    <SelectValue placeholder="Export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Canvas Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center bg-gray-100 relative">
            <div className="border-2 border-gray-300 shadow-lg relative">
              <canvas ref={canvasRef} />
              {/* Zoom indicator */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <Card className="w-80 flex-shrink-0 m-4">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Properties</h3>

              {/* Font Properties */}
              <div className="space-y-3">
                <Label>Font</Label>
                <Input
                  value={selectedFontFamily}
                  onChange={(e) => setSelectedFontFamily(e.target.value)}
                  placeholder="Font family"
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Size:</Label>
                  <Input
                    type="number"
                    value={selectedFontSize}
                    onChange={(e) => setSelectedFontSize(parseInt(e.target.value))}
                    className="w-20"
                    min="8"
                    max="200"
                  />
                </div>
                <Select value={selectedWeight} onValueChange={(value: any) => setSelectedWeight(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedAlign} onValueChange={(value: any) => setSelectedAlign(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Color */}
              <div className="space-y-3">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded border-2"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Input
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <Separator />

              {/* Canvas Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform:</span>
                  <span>{platform.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span>{platform.dimensions.width} × {platform.dimensions.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Text Elements:</span>
                  <span>{positionManager?.getAllTexts().length || 0}</span>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    positionManager?.selectText(positionManager.getAllTexts()[0]?.id || "");
                  }}
                >
                  Select First Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    positionManager?.clearAllTexts();
                    saveToHistory();
                  }}
                >
                  Clear All Texts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </CanvasErrorBoundary>
  );
}

export default CanvasEditor;
