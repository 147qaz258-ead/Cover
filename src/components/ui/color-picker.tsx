"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, Palette, Eye, EyeOff } from "lucide-react";

interface ColorPickerProps {
  value?: string;
  onChange?: (color: string) => void;
  disabled?: boolean;
  label?: string;
  showAlpha?: boolean;
  presetColors?: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DEFAULT_PRESET_COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
  "#FF00FF", "#00FFFF", "#FF8C00", "#9370DB", "#32CD32", "#FF69B4",
  "#4B0082", "#00CED1", "#FF1493", "#1E90FF", "#FFD700", "#8B4513",
  "#2F4F4F", "#DC143C", "#00FA9A", "#4169E1", "#FF6347", "#40E0D0",
  "#EE82EE", "#F5DEB3", "#A52A2A", "#5F9EA0", "#D2691E", "#FF7F50",
  "#6495ED", "#DCDCDC", "#F0F8FF", "#FAFAD2", "#D3D3D3", "#90EE90",
];

export function ColorPicker({
  value = "#000000",
  onChange,
  disabled = false,
  label,
  showAlpha = false,
  presetColors = DEFAULT_PRESET_COLORS,
  size = "md",
  className,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [lightness, setLightness] = useState(0);
  const [alpha, setAlpha] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const alphaCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
    const hsl = hexToHsl(value);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  }, [value]);

  // Update color canvas
  useEffect(() => {
    drawColorCanvas();
    if (showAlpha) {
      drawAlphaCanvas();
    }
  }, [hue, saturation, lightness, alpha]);

  const drawColorCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw saturation/lightness gradient
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const saturation = (x / width) * 100;
        const lightness = (1 - y / height) * 100;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  };

  const drawAlphaCanvas = () => {
    const canvas = alphaCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw checkerboard pattern
    const squareSize = 8;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isLight = ((x / squareSize) + (y / squareSize)) % 2 < 1;
        ctx.fillStyle = isLight ? "#FFFFFF" : "#E5E5E5";
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Draw alpha gradient
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 1)`;
    ctx.fillRect(0, 0, width, height);
  };

  const handleColorCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const saturation = (x / rect.width) * 100;
    const lightness = (1 - y / rect.height) * 100;

    setSaturation(saturation);
    setLightness(lightness);

    const color = hslToHex(hue, saturation, lightness);
    setInternalValue(color);
    onChange?.(color);
  };

  const handleAlphaCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled || !showAlpha) return;

    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const newAlpha = x / rect.width;
    setAlpha(newAlpha);

    const hex = hslToHex(hue, saturation, lightness);
    const rgba = hexToRgba(hex, newAlpha);
    setInternalValue(rgba);
    onChange?.(rgba);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalValue(value);

    if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^rgba?\(.*\)$/.test(value)) {
      onChange?.(value);
      const hsl = hexToHsl(value);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  };

  const handleHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = parseInt(e.target.value);
    setHue(newHue);

    const color = hslToHex(newHue, saturation, lightness);
    setInternalValue(color);
    onChange?.(color);
  };

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAlpha = parseFloat(e.target.value);
    setAlpha(newAlpha);

    const hex = hslToHex(hue, saturation, lightness);
    const rgba = hexToRgba(hex, newAlpha);
    setInternalValue(rgba);
    onChange?.(rgba);
  };

  const handlePresetClick = (color: string) => {
    if (disabled) return;

    setInternalValue(color);
    onChange?.(color);
    const hsl = hexToHsl(color);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const canvasSize = {
    sm: 120,
    md: 180,
    lg: 240,
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              sizeClasses[size],
              "p-1 border-2 relative overflow-hidden"
            )}
            disabled={disabled}
          >
            <div
              className="w-full h-full rounded"
              style={{ backgroundColor: internalValue }}
            />
            {showAlpha && hasAlpha(internalValue) && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 opacity-20 bg-white"></div>
                  <div className="absolute inset-0 opacity-10 bg-black"></div>
                </div>
              </div>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          <Card className="border-0 shadow-none">
            <CardContent className="p-4 space-y-4">
              {/* Color Canvas */}
              <div className="space-y-2">
                <Label>Color</Label>
                <canvas
                  ref={canvasRef}
                  width={canvasSize[size]}
                  height={canvasSize[size]}
                  className="w-full h-32 rounded cursor-crosshair border"
                  onClick={handleColorCanvasClick}
                />
              </div>

              {/* Hue Slider */}
              <div className="space-y-2">
                <Label>Hue</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hue}
                    onChange={handleHueChange}
                    className="flex-1"
                    disabled={disabled}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="360"
                    value={Math.round(hue)}
                    onChange={handleHueChange}
                    className="w-16 text-xs"
                    disabled={disabled}
                  />
                </div>
              </div>

              {/* Alpha Slider */}
              {showAlpha && (
                <div className="space-y-2">
                  <Label>Alpha</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={alpha}
                      onChange={handleAlphaChange}
                      className="flex-1"
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={alpha.toFixed(2)}
                      onChange={handleAlphaChange}
                      className="w-16 text-xs"
                      disabled={disabled}
                    />
                  </div>
                </div>
              )}

              {/* Hex Input */}
              <div className="space-y-2">
                <Label>Hex Code</Label>
                <Input
                  value={internalValue}
                  onChange={handleHexInput}
                  placeholder="#000000"
                  disabled={disabled}
                />
              </div>

              {/* Preset Colors */}
              <div className="space-y-2">
                <Label>Preset Colors</Label>
                <div className="grid grid-cols-8 gap-1">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-8 h-8 rounded border-2 transition-all",
                        internalValue.toLowerCase() === color.toLowerCase()
                          ? "border-primary"
                          : "border-border hover:border-primary/50"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handlePresetClick(color)}
                      disabled={disabled}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Helper functions
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;

  // Remove the hash and handle rgba
  hex = hex.replace(/^#/, "");
  if (hex.startsWith("rgba")) {
    const values = hex.match(/\d+/g);
    if (values && values.length >= 3) {
      r = parseInt(values[0]) / 255;
      g = parseInt(values[1]) / 255;
      b = parseInt(values[2]) / 255;
    }
  } else {
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      r = parseInt(result[1], 16) / 255;
      g = parseInt(result[2], 16) / 255;
      b = parseInt(result[3], 16) / 255;
    }
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

function hasAlpha(color: string): boolean {
  return color.startsWith("rgba") || color.startsWith("hsla");
}

export default ColorPicker;