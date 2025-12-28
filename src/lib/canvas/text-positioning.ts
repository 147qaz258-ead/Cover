import { Canvas, IText, FabricObject, Shadow, BasicTransformEvent, TPointerEvent, ModifiedEvent } from "fabric";

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold" | "light" | "medium";
  color: string;
  textAlign: "left" | "center" | "right";
  maxWidth?: number;
  lineHeight?: number;
  rotation?: number;
  opacity?: number;
  shadow?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface DragAndDropOptions {
  snapToGrid?: boolean;
  gridSize?: number;
  showBoundingBox?: boolean;
  lockAspectRatio?: boolean;
  constrainToCanvas?: boolean;
  multiSelect?: boolean;
}

/**
 * Text positioning manager for canvas
 */
export class TextPositioningManager {
  private canvas: Canvas;
  private options: DragAndDropOptions;
  private textElements: Map<string, IText> = new Map();

  constructor(canvas: Canvas, options: DragAndDropOptions = {}) {
    this.canvas = canvas;
    this.options = {
      snapToGrid: false,
      gridSize: 10,
      showBoundingBox: true,
      lockAspectRatio: false,
      constrainToCanvas: true,
      multiSelect: false,
      ...options,
    };

    this.setupCanvas();
  }

  /**
   * Setup canvas with drag and drop configuration
   */
  private setupCanvas(): void {
    // Enable object controls
    this.canvas.selection = this.options.multiSelect ?? false;

    // Set default object properties
    FabricObject.prototype.set({
      transparentCorners: false,
      cornerColor: "#4A90E2",
      cornerSize: 8,
      cornerStyle: "circle",
      borderColor: "#4A90E2",
      borderScaleFactor: 2,
      rotatingPointOffset: 30,
    });

    // Add event listeners
    this.canvas.on("object:moving", (e: BasicTransformEvent<TPointerEvent>) => this.handleObjectMoving(e));
    this.canvas.on("object:scaling", (e: BasicTransformEvent<TPointerEvent>) => this.handleObjectScaling(e));
    this.canvas.on("object:rotating", (e: BasicTransformEvent<TPointerEvent>) => this.handleObjectRotating(e));
    this.canvas.on("object:modified", (e: ModifiedEvent<TPointerEvent>) => this.handleObjectModified(e));
  }

  /**
   * Add text element to canvas
   */
  addText(element: TextElement): IText {
    const fabricText = new IText(element.text, {
      left: element.x,
      top: element.y,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fontWeight: element.fontWeight,
      fill: element.color,
      textAlign: element.textAlign,
      width: element.maxWidth,
      lineHeight: element.lineHeight,
      angle: element.rotation || 0,
      opacity: element.opacity || 1,
      shadow: element.shadow ? new Shadow(element.shadow) : undefined,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      id: element.id,
      editable: true,
    });

    // Add to canvas
    this.canvas.add(fabricText);
    this.textElements.set(element.id, fabricText);

    // Select the new element
    this.canvas.setActiveObject(fabricText);
    this.canvas.renderAll();

    return fabricText;
  }

  /**
   * Update text element
   */
  updateText(id: string, updates: Partial<TextElement>): void {
    const textElement = this.textElements.get(id);
    if (!textElement) return;

    const updatesMap: Partial<IText> = {};

    // Map updates to fabric properties
    if (updates.text !== undefined) updatesMap.text = updates.text;
    if (updates.x !== undefined) updatesMap.left = updates.x;
    if (updates.y !== undefined) updatesMap.top = updates.y;
    if (updates.fontSize !== undefined) updatesMap.fontSize = updates.fontSize;
    if (updates.fontFamily !== undefined) updatesMap.fontFamily = updates.fontFamily;
    if (updates.fontWeight !== undefined) updatesMap.fontWeight = updates.fontWeight;
    if (updates.color !== undefined) updatesMap.fill = updates.color;
    if (updates.textAlign !== undefined) updatesMap.textAlign = updates.textAlign;
    if (updates.maxWidth !== undefined) updatesMap.width = updates.maxWidth;
    if (updates.lineHeight !== undefined) updatesMap.lineHeight = updates.lineHeight;
    if (updates.rotation !== undefined) updatesMap.angle = updates.rotation;
    if (updates.opacity !== undefined) updatesMap.opacity = updates.opacity;
    if (updates.shadow !== undefined) updatesMap.shadow = new Shadow(updates.shadow);
    if (updates.stroke !== undefined) updatesMap.stroke = updates.stroke;
    if (updates.strokeWidth !== undefined) updatesMap.strokeWidth = updates.strokeWidth;

    textElement.set(updatesMap);
    this.canvas.renderAll();
  }

  /**
   * Remove text element from canvas
   */
  removeText(id: string): void {
    const textElement = this.textElements.get(id);
    if (!textElement) return;

    this.canvas.remove(textElement);
    this.textElements.delete(id);
    this.canvas.renderAll();
  }

  /**
   * Get all text elements
   */
  getAllTexts(): TextElement[] {
    const elements: TextElement[] = [];

    this.textElements.forEach((fabricText, id) => {
      elements.push({
        id,
        text: fabricText.text || "",
        x: fabricText.left || 0,
        y: fabricText.top || 0,
        fontSize: fabricText.fontSize || 16,
        fontFamily: fabricText.fontFamily || "Arial",
        fontWeight: (fabricText.fontWeight as any) || "normal",
        color: (fabricText.fill as string) || "#000000",
        textAlign: (fabricText.textAlign as any) || "left",
        maxWidth: fabricText.width || undefined,
        lineHeight: fabricText.lineHeight || undefined,
        rotation: fabricText.angle || 0,
        opacity: fabricText.opacity || 1,
        shadow: fabricText.shadow?.toString(),
        stroke: fabricText.stroke as string,
        strokeWidth: fabricText.strokeWidth,
      });
    });

    return elements;
  }

  /**
   * Get text element by ID
   */
  getText(id: string): TextElement | undefined {
    const fabricText = this.textElements.get(id);
    if (!fabricText) return undefined;

    return {
      id,
      text: fabricText.text || "",
      x: fabricText.left || 0,
      y: fabricText.top || 0,
      fontSize: fabricText.fontSize || 16,
      fontFamily: fabricText.fontFamily || "Arial",
      fontWeight: (fabricText.fontWeight as any) || "normal",
      color: (fabricText.fill as string) || "#000000",
      textAlign: (fabricText.textAlign as any) || "left",
      maxWidth: fabricText.width || undefined,
      lineHeight: fabricText.lineHeight || undefined,
      rotation: fabricText.angle || 0,
      opacity: fabricText.opacity || 1,
      shadow: fabricText.shadow?.toString(),
      stroke: fabricText.stroke as string,
      strokeWidth: fabricText.strokeWidth,
    };
  }

  /**
   * Select text element
   */
  selectText(id: string): void {
    const textElement = this.textElements.get(id);
    if (textElement) {
      this.canvas.setActiveObject(textElement);
      this.canvas.renderAll();
    }
  }

  /**
   * Clear all text elements
   */
  clearAllTexts(): void {
    this.textElements.forEach((textElement) => {
      this.canvas.remove(textElement);
    });
    this.textElements.clear();
    this.canvas.renderAll();
  }

  /**
   * Handle object moving event
   */
  private handleObjectMoving(e: BasicTransformEvent<TPointerEvent>): void {
    const target = e.transform?.target as IText;
    if (!target) return;

    // Snap to grid if enabled
    if (this.options.snapToGrid) {
      const gridSize = this.options.gridSize || 10;
      target.set({
        left: Math.round(target.left! / gridSize) * gridSize,
        top: Math.round(target.top! / gridSize) * gridSize,
      });
    }

    // Constrain to canvas if enabled
    if (this.options.constrainToCanvas) {
      const canvasWidth = this.canvas.width ?? 0;
      const canvasHeight = this.canvas.height ?? 0;
      const objWidth = target.getScaledWidth();
      const objHeight = target.getScaledHeight();

      target.set({
        left: Math.max(0, Math.min(target.left!, canvasWidth - objWidth)),
        top: Math.max(0, Math.min(target.top!, canvasHeight - objHeight)),
      });
    }
  }

  /**
   * Handle object scaling event
   */
  private handleObjectScaling(e: BasicTransformEvent<TPointerEvent>): void {
    const target = e.transform?.target as IText;
    if (!target) return;

    // Lock aspect ratio if enabled
    if (this.options.lockAspectRatio) {
      // This is handled by fabric's lockScalingX/Y properties
    }

    // Snap to grid if enabled
    if (this.options.snapToGrid) {
      const gridSize = this.options.gridSize || 10;
      target.set({
        scaleX: Math.round(target.scaleX! * gridSize) / gridSize,
        scaleY: Math.round(target.scaleY! * gridSize) / gridSize,
      });
    }
  }

  /**
   * Handle object rotating event
   */
  private handleObjectRotating(e: BasicTransformEvent<TPointerEvent>): void {
    const target = e.transform?.target as IText;
    if (!target) return;

    // Snap to angles if grid is enabled (every 15 degrees)
    if (this.options.snapToGrid) {
      const snapAngle = 15;
      target.set({
        angle: Math.round(target.angle! / snapAngle) * snapAngle,
      });
    }
  }

  /**
   * Handle object modified event
   */
  private handleObjectModified(e: ModifiedEvent<TPointerEvent>): void {
    // This is called after any modification
    this.canvas.renderAll();
  }

  /**
   * Load text elements from JSON
   */
  loadFromJSON(json: any): void {
    this.canvas.loadFromJSON(json, () => {
      // Rebuild textElements map
      this.textElements.clear();
      this.canvas.getObjects().forEach((obj: FabricObject) => {
        if (obj.type === "i-text" && (obj as any).id) {
          this.textElements.set((obj as any).id, obj as IText);
        }
      });
      this.canvas.renderAll();
    });
  }

  /**
   * Export canvas to JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this.canvas.toJSON());
  }

  /**
   * Update options
   */
  updateOptions(newOptions: Partial<DragAndDropOptions>): void {
    this.options = { ...this.options, ...newOptions };
    this.canvas.selection = this.options.multiSelect ?? false;
  }

  /**
   * Destroy the positioning manager
   */
  destroy(): void {
    // Clear all event listeners
    this.canvas.off("object:moving");
    this.canvas.off("object:scaling");
    this.canvas.off("object:rotating");
    this.canvas.off("object:modified");

    // Clear text elements
    this.textElements.clear();
  }
}

/**
 * Factory function to create text positioning manager
 */
export function createTextPositioningManager(
  canvas: Canvas,
  options?: DragAndDropOptions
): TextPositioningManager {
  return new TextPositioningManager(canvas, options);
}

/**
 * Utility to create a text element from IText
 */
export function fabricTextToTextElement(fabricText: IText & { id?: string }): TextElement | undefined {
  if (!fabricText.id) return undefined;

  return {
    id: fabricText.id,
    text: fabricText.text || "",
    x: fabricText.left || 0,
    y: fabricText.top || 0,
    fontSize: fabricText.fontSize || 16,
    fontFamily: fabricText.fontFamily || "Arial",
    fontWeight: (fabricText.fontWeight as any) || "normal",
    color: (fabricText.fill as string) || "#000000",
    textAlign: (fabricText.textAlign as any) || "left",
    maxWidth: fabricText.width || undefined,
    lineHeight: fabricText.lineHeight || undefined,
    rotation: fabricText.angle || 0,
    opacity: fabricText.opacity || 1,
    shadow: fabricText.shadow?.toString(),
    stroke: fabricText.stroke as string,
    strokeWidth: fabricText.strokeWidth,
  };
}