/**
 * Clipboard utilities for copy operations
 * Uses native Clipboard API with fallbacks
 */

export interface CopyImageResult {
  success: boolean;
  error?: string;
}

/**
 * Copy image and text to clipboard
 * @param imageUrl - URL of the image to copy
 * @param text - Text content to copy
 * @param title - Title for the content
 * @returns Result object with success status
 */
export async function copyImageAndText(
  imageUrl: string,
  text: string,
  title: string
): Promise<CopyImageResult> {
  try {
    // Try to copy both image and text
    // Note: Some browsers only support one type at a time

    // First, try to copy image
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Check if ClipboardItem API is supported
    if (typeof ClipboardItem !== "undefined") {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);

        // Also copy text separately
        await navigator.clipboard.writeText(text);

        return { success: true };
      } catch (imageError) {
        // Image copy failed, fallback to text only
        console.warn("Image copy failed, falling back to text only:", imageError);
      }
    }

    // Fallback: copy text only
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    console.error("Copy failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Copy text to clipboard with formatted content
 * @param title - Title of the content
 * @param subtitle - Subtitle or description
 * @param includeHashtags - Whether to include default hashtags
 * @returns Success status
 */
export async function copyFormattedText(
  title: string,
  subtitle?: string,
  includeHashtags = true
): Promise<boolean> {
  try {
    let text = `🎨 ${title}\n`;

    if (subtitle) {
      text += `\n📝 ${subtitle}\n`;
    }

    if (includeHashtags) {
      text += `\n🏷️ #AI设计 #封面设计 #小红书封面`;
    }

    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Text copy failed:", error);
    return false;
  }
}

/**
 * Copy image to clipboard (image only)
 * @param imageUrl - URL of the image
 * @returns Success status
 */
export async function copyImageOnly(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    if (typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Image copy failed:", error);
    return false;
  }
}

/**
 * Check if clipboard API is available
 * @returns True if clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "clipboard" in navigator &&
    typeof navigator.clipboard.writeText === "function"
  );
}

/**
 * Check if clipboard image copying is supported
 * @returns True if ClipboardItem API is supported
 */
export function isClipboardImageSupported(): boolean {
  return typeof ClipboardItem !== "undefined";
}
