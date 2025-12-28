"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StyleTemplate } from "@/types";
import { STYLE_TEMPLATES } from "@/data/templates";
import { cn } from "@/lib/utils";

interface StyleSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function StyleSelector({
  selectedTemplate,
  onTemplateChange,
  disabled = false,
  compact = false,
}: StyleSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const selectedStyle = STYLE_TEMPLATES.find(t => t.id === selectedTemplate);

  const groupedTemplates = {
    minimal: STYLE_TEMPLATES.filter(t =>
      ["minimal-clean", "tech-blue", "business-gray"].includes(t.id)
    ),
    elegant: STYLE_TEMPLATES.filter(t =>
      ["elegant-gold", "warm-pink", "vintage-brown"].includes(t.id)
    ),
    creative: STYLE_TEMPLATES.filter(t =>
      ["gradient-purple", "nature-fresh", "artistic-multi"].includes(t.id)
    ),
    bold: STYLE_TEMPLATES.filter(t =>
      ["modern-bold"].includes(t.id)
    ),
  };

  return (
    <Card className={`w-full ${compact ? 'border-0 shadow-none' : ''}`}>
      <CardHeader className={compact ? 'py-3' : ''}>
        <CardTitle className={`flex items-center gap-2 ${compact ? 'text-base' : ''}`}>
          <span>{compact ? '风格' : '选择风格'}</span>
          {selectedStyle && (
            <Badge variant="secondary" className={compact ? 'text-xs' : ''}>
              {selectedStyle.name}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={`space-y-${compact ? '3' : '6'}`}>
        {/* Selected Template Preview */}
        {selectedStyle && (
          <div className="p-4 rounded-lg border-2 border-dashed">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{selectedStyle.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTemplateChange("")}
                  disabled={disabled}
                >
                  清除选择
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {selectedStyle.description}
              </p>
              <div className="flex gap-2 text-xs">
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: selectedStyle.backgroundColor }}
                />
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: selectedStyle.textColor }}
                />
                <div
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: selectedStyle.accentColor }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Template Groups */}
        {Object.entries(groupedTemplates).map(([category, templates]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-medium capitalize">
              {category === "minimal" && "简约风格"}
              {category === "elegant" && "优雅风格"}
              {category === "creative" && "创意风格"}
              {category === "bold" && "醒目风格"}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onTemplateChange(template.id)}
                  disabled={disabled}
                  className={cn(
                    "relative group rounded-lg border-2 p-3 transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                >
                  <div className="space-y-2">
                    {/* Color Preview */}
                    <div className="flex justify-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.backgroundColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.textColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: template.accentColor }}
                      />
                    </div>

                    {/* Template Name */}
                    <div className="text-xs font-medium text-center">
                      {template.name}
                    </div>

                    {/* Hover Preview */}
                    {hoveredTemplate === template.id && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg z-10">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-muted-foreground mt-1">
                          {template.description}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedTemplate === template.id && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Custom Style Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
          💡 提示：选择适合您内容风格的模板，AI将根据模板特点生成相应风格的封面
        </div>
      </CardContent>
    </Card>
  );
}