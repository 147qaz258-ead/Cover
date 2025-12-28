"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import { FontSelector } from "@/components/ui/font-selector";
import { TextElement } from "@/lib/canvas/text-positioning";
import { Canvas, IText, FabricObject, FabricImage, Shadow } from "fabric";
import { cn } from "@/lib/utils";
import {
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Move,
  Square,
  RotateCw,
  Trash2,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";

interface PropertyPanelProps {
  canvas?: Canvas;
  selectedObject?: FabricObject | FabricObject[];
  onPropertyChange?: (property: string, value: any) => void;
  onObjectUpdate?: (objectId: string, updates: Partial<TextElement>) => void;
  onObjectDelete?: (objectId: string) => void;
  onObjectDuplicate?: (objectId: string) => void;
  className?: string;
}

interface TextProperties {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold" | "light" | "medium";
  fontStyle: "normal" | "italic";
  textDecoration: "normal" | "underline";
  textAlign: "left" | "center" | "right";
  color: string;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  lineHeight: number;
  letterSpacing: number;
  shadow: string;
  stroke: string;
  strokeWidth: number;
}

interface ImageProperties {
  src: string;
  opacity: number;
  rotation: number;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

export function PropertyPanel({
  canvas,
  selectedObject,
  onPropertyChange,
  onObjectUpdate,
  onObjectDelete,
  onObjectDuplicate,
  className,
}: PropertyPanelProps) {
  const [properties, setProperties] = useState<TextProperties | ImageProperties>({
    text: "",
    fontSize: 16,
    fontFamily: "Inter",
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "normal",
    textAlign: "left",
    color: "#000000",
    opacity: 1,
    rotation: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    lineHeight: 1.2,
    letterSpacing: 0,
    shadow: "",
    stroke: "",
    strokeWidth: 0,
  });

  const [activeTab, setActiveTab] = useState<"text" | "position" | "style">("text");

  // Detect object type
  const getObjectType = (obj: FabricObject | FabricObject[] | undefined): "text" | "image" | "unknown" => {
    if (!obj) return "unknown";
    const firstObj = Array.isArray(obj) ? obj[0] : obj;
    if (firstObj.type === "i-text") return "text";
    if (firstObj.type === "image") return "image";
    return "unknown";
  };

  const objectType = getObjectType(selectedObject);

  // Update properties when selection changes
  useEffect(() => {
    if (!selectedObject) {
      setProperties({
        text: "",
        fontSize: 16,
        fontFamily: "Inter",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "normal",
        textAlign: "left",
        color: "#000000",
        opacity: 1,
        rotation: 0,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1,
        lineHeight: 1.2,
        letterSpacing: 0,
        shadow: "",
        stroke: "",
        strokeWidth: 0,
      });
      return;
    }

    const objects = Array.isArray(selectedObject) ? selectedObject : [selectedObject];
    if (objects.length === 0) return;

    const obj = objects[0];

    if (obj.type === "i-text") {
      const textObj = obj as IText;
      const newProps: TextProperties = {
        text: textObj.text || "",
        fontSize: textObj.fontSize || 16,
        fontFamily: textObj.fontFamily || "Inter",
        fontWeight: (textObj.fontWeight as any) || "normal",
        fontStyle: (textObj.fontStyle as any) || "normal",
        textDecoration: (textObj.underline ? "underline" : "normal") as any,
        textAlign: (textObj.textAlign as any) || "left",
        color: (textObj.fill as string) || "#000000",
        opacity: textObj.opacity || 1,
        rotation: textObj.angle || 0,
        x: textObj.left || 0,
        y: textObj.top || 0,
        width: textObj.width || 0,
        height: textObj.height || 0,
        scaleX: textObj.scaleX || 1,
        scaleY: textObj.scaleY || 1,
        lineHeight: textObj.lineHeight || 1.2,
        letterSpacing: textObj.charSpacing || 0,
        shadow: textObj.shadow?.toString() || "",
        stroke: (textObj.stroke as string) || "",
        strokeWidth: textObj.strokeWidth || 0,
      };
      setProperties(newProps);
      setActiveTab("text");
    } else if (obj.type === "image") {
      const imgObj = obj as FabricImage;
      const newProps: ImageProperties = {
        src: (imgObj as any).src || "",
        opacity: imgObj.opacity || 1,
        rotation: imgObj.angle || 0,
        x: imgObj.left || 0,
        y: imgObj.top || 0,
        width: imgObj.width || 0,
        height: imgObj.height || 0,
        scaleX: imgObj.scaleX || 1,
        scaleY: imgObj.scaleY || 1,
      };
      setProperties(newProps as any);
      setActiveTab("position");
    }
  }, [selectedObject]);

  // Handle property changes
  const handlePropertyChange = (property: string, value: any) => {
    setProperties((prev) => ({ ...prev, [property]: value }));

    if (!canvas || !selectedObject) return;

    const objects = Array.isArray(selectedObject) ? selectedObject : [selectedObject];
    objects.forEach((obj) => {
      if (obj.type === "i-text") {
        const textObj = obj as IText;

        switch (property) {
          case "text":
            textObj.set("text", value);
            break;
          case "fontSize":
            textObj.set("fontSize", value);
            break;
          case "fontFamily":
            textObj.set("fontFamily", value);
            break;
          case "fontWeight":
            textObj.set("fontWeight", value);
            break;
          case "fontStyle":
            textObj.set("fontStyle", value);
            break;
          case "textDecoration":
            textObj.set("underline", value === "underline");
            break;
          case "textAlign":
            textObj.set("textAlign", value);
            break;
          case "color":
            textObj.set("fill", value);
            break;
          case "opacity":
            textObj.set("opacity", value);
            break;
          case "rotation":
            textObj.set("angle", value);
            break;
          case "x":
            textObj.set("left", value);
            break;
          case "y":
            textObj.set("top", value);
            break;
          case "scaleX":
            textObj.set("scaleX", value);
            break;
          case "scaleY":
            textObj.set("scaleY", value);
            break;
          case "lineHeight":
            textObj.set("lineHeight", value);
            break;
          case "letterSpacing":
            textObj.set("charSpacing", value);
            break;
          case "shadow":
            textObj.set("shadow", value ? new Shadow(value) : null);
            break;
          case "stroke":
            textObj.set("stroke", value);
            break;
          case "strokeWidth":
            textObj.set("strokeWidth", value);
            break;
        }
      } else if (obj.type === "image") {
        const imgObj = obj as FabricImage;
        switch (property) {
          case "opacity":
            imgObj.set("opacity", value);
            break;
          case "rotation":
            imgObj.set("angle", value);
            break;
          case "x":
            imgObj.set("left", value);
            break;
          case "y":
            imgObj.set("top", value);
            break;
          case "scaleX":
            imgObj.set("scaleX", value);
            break;
          case "scaleY":
            imgObj.set("scaleY", value);
            break;
        }
      }
    });

    canvas.renderAll();
    onPropertyChange?.(property, value);
  };

  const handleDelete = () => {
    if (!canvas || !selectedObject) return;

    const objects = Array.isArray(selectedObject) ? selectedObject : [selectedObject];
    objects.forEach((obj) => {
      if ((obj as any).id) {
        onObjectDelete?.((obj as any).id);
      }
      canvas.remove(obj);
    });

    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const handleDuplicate = () => {
    if (!canvas || !selectedObject) return;

    const objects = Array.isArray(selectedObject) ? selectedObject : [selectedObject];
    objects.forEach(async (obj) => {
      const cloned = await obj.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);

      if ((obj as any).id) {
        onObjectDuplicate?.((obj as any).id);
      }
    });

    canvas.renderAll();
  };

  const handleAlign = (align: "left" | "center" | "right") => {
    handlePropertyChange("textAlign", align);
  };

  const handleBold = () => {
    const props = properties as TextProperties;
    const newWeight = props.fontWeight === "bold" ? "normal" : "bold";
    handlePropertyChange("fontWeight", newWeight);
  };

  const handleItalic = () => {
    const props = properties as TextProperties;
    const newStyle = props.fontStyle === "italic" ? "normal" : "italic";
    handlePropertyChange("fontStyle", newStyle);
  };

  const handleUnderline = () => {
    const props = properties as TextProperties;
    const newDecoration = props.textDecoration === "underline" ? "normal" : "underline";
    handlePropertyChange("textDecoration", newDecoration);
  };

  const firstObject = Array.isArray(selectedObject) ? selectedObject[0] : selectedObject;
  const isVisible = firstObject && firstObject.visible !== false;

  if (!selectedObject) {
    return (
      <Card className={cn("w-80", className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Square className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No object selected</p>
            <p className="text-sm">Select an object to edit its properties</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isText = objectType === "text";
  const props = properties as TextProperties;

  return (
    <Card className={cn("w-80", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {isText ? "Text Properties" : "Image Properties"}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => canvas?.discardActiveObject()}
              title="Deselect"
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDuplicate}
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (selectedObject) {
                  const objects = Array.isArray(selectedObject) ? selectedObject : [selectedObject];
                  objects.forEach((obj) => {
                    obj.set("visible", !obj.visible);
                  });
                  canvas?.renderAll();
                }
              }}
              title={isVisible ? "Hide" : "Show"}
            >
              {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Tabs */}
        <div className="flex border-b">
          {isText && (
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "text" && "border-primary text-primary"
              )}
              onClick={() => setActiveTab("text")}
            >
              <Type className="w-4 h-4 inline mr-1" />
              Text
            </button>
          )}
          <button
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "position" && "border-primary text-primary"
            )}
            onClick={() => setActiveTab("position")}
          >
            <Move className="w-4 h-4 inline mr-1" />
            Position
          </button>
          {isText && (
            <button
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "style" && "border-primary text-primary"
              )}
              onClick={() => setActiveTab("style")}
            >
              <Palette className="w-4 h-4 inline mr-1" />
              Style
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {isText && activeTab === "text" && (
            <>
              {/* Text Content */}
              <div className="space-y-2">
                <Label>Text</Label>
                <Textarea
                  value={props.text}
                  onChange={(e) => handlePropertyChange("text", e.target.value)}
                  placeholder="Enter your text..."
                  rows={3}
                />
              </div>

              {/* Font Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={props.fontWeight === "bold" ? "default" : "outline"}
                    onClick={handleBold}
                  >
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={props.fontStyle === "italic" ? "default" : "outline"}
                    onClick={handleItalic}
                  >
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={props.textDecoration === "underline" ? "default" : "outline"}
                    onClick={handleUnderline}
                  >
                    <Underline className="w-4 h-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    size="sm"
                    variant={props.textAlign === "left" ? "default" : "outline"}
                    onClick={() => handleAlign("left")}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={props.textAlign === "center" ? "default" : "outline"}
                    onClick={() => handleAlign("center")}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={props.textAlign === "right" ? "default" : "outline"}
                    onClick={() => handleAlign("right")}
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Font Family */}
                <FontSelector
                  value={props.fontFamily}
                  onChange={(value) => handlePropertyChange("fontFamily", value)}
                  label="Font Family"
                />

                {/* Font Size */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Font Size</Label>
                    <span className="text-sm text-muted-foreground">{props.fontSize}px</span>
                  </div>
                  <Slider
                    value={[props.fontSize]}
                    onValueChange={([value]) => handlePropertyChange("fontSize", value)}
                    min={8}
                    max={200}
                    step={1}
                  />
                </div>

                {/* Line Height */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Height</Label>
                    <span className="text-sm text-muted-foreground">{props.lineHeight.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[props.lineHeight]}
                    onValueChange={([value]) => handlePropertyChange("lineHeight", value)}
                    min={0.8}
                    max={3}
                    step={0.1}
                  />
                </div>

                {/* Letter Spacing */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Letter Spacing</Label>
                    <span className="text-sm text-muted-foreground">{props.letterSpacing}px</span>
                  </div>
                  <Slider
                    value={[props.letterSpacing]}
                    onValueChange={([value]) => handlePropertyChange("letterSpacing", value)}
                    min={-5}
                    max={20}
                    step={0.5}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "position" && (
            <>
              {/* Position */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>X Position</Label>
                  <Input
                    type="number"
                    value={Math.round(properties.x)}
                    onChange={(e) => handlePropertyChange("x", parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Y Position</Label>
                  <Input
                    type="number"
                    value={Math.round(properties.y)}
                    onChange={(e) => handlePropertyChange("y", parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Rotation</Label>
                  <span className="text-sm text-muted-foreground">{properties.rotation}°</span>
                </div>
                <Slider
                  value={[properties.rotation]}
                  onValueChange={([value]) => handlePropertyChange("rotation", value)}
                  min={-180}
                  max={180}
                  step={1}
                />
              </div>

              {/* Scale */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Scale</Label>
                  <span className="text-sm text-muted-foreground">
                    {properties.scaleX.toFixed(2)}x
                  </span>
                </div>
                <Slider
                  value={[properties.scaleX * 100]}
                  onValueChange={([value]) => {
                    const scale = value / 100;
                    handlePropertyChange("scaleX", scale);
                    handlePropertyChange("scaleY", scale);
                  }}
                  min={10}
                  max={300}
                  step={1}
                />
              </div>

              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Opacity</Label>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(properties.opacity * 100)}%
                  </span>
                </div>
                <Slider
                  value={[properties.opacity * 100]}
                  onValueChange={([value]) => handlePropertyChange("opacity", value / 100)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            </>
          )}

          {isText && activeTab === "style" && (
            <>
              {/* Color */}
              <ColorPicker
                value={props.color}
                onChange={(value) => handlePropertyChange("color", value)}
                label="Text Color"
              />

              {/* Shadow */}
              <div className="space-y-2">
                <Label>Shadow</Label>
                <Input
                  value={props.shadow}
                  onChange={(e) => handlePropertyChange("shadow", e.target.value)}
                  placeholder="e.g., 2px 2px 4px rgba(0,0,0,0.5)"
                />
              </div>

              {/* Stroke */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Stroke Color</Label>
                  <Input
                    type="color"
                    value={props.stroke || "#000000"}
                    onChange={(e) => handlePropertyChange("stroke", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Stroke Width</Label>
                    <span className="text-sm text-muted-foreground">{props.strokeWidth}px</span>
                  </div>
                  <Slider
                    value={[props.strokeWidth]}
                    onValueChange={([value]) => handlePropertyChange("strokeWidth", value)}
                    min={0}
                    max={10}
                    step={0.5}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PropertyPanel;
