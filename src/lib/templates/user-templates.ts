import { CoverCustomizations, StyleTemplate } from "@/types";
import { TextElement } from "@/lib/canvas/text-positioning";

export interface UserTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  platform: string; // Platform ID this template is designed for
  preview?: string; // Base64 encoded preview image
  customizations: CoverCustomizations;
  textElements: TextElement[];
  createdAt: Date;
  updatedAt: Date;
  isPublic?: boolean;
  author?: string;
  downloads?: number;
  rating?: number;
}

export interface TemplateLibrary {
  templates: UserTemplate[];
  categories: string[];
  tags: string[];
}

export interface TemplateFilter {
  category?: string;
  tags?: string[];
  platform?: string;
  isPublic?: boolean;
  search?: string;
}

/**
 * User template management system
 */
export class UserTemplateManager {
  private storageKey = "user-templates";
  private library: TemplateLibrary = {
    templates: [],
    categories: [],
    tags: [],
  };

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Save template to library
   */
  async saveTemplate(template: Omit<UserTemplate, "id" | "createdAt" | "updatedAt">): Promise<UserTemplate> {
    const newTemplate: UserTemplate = {
      ...template,
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if template with same name already exists
    const existingIndex = this.library.templates.findIndex((t) => t.name === newTemplate.name);
    if (existingIndex !== -1) {
      // Update existing template
      this.library.templates[existingIndex] = { ...newTemplate, id: this.library.templates[existingIndex].id };
    } else {
      // Add new template
      this.library.templates.push(newTemplate);
    }

    // Update categories and tags
    this.updateCategoriesAndTags();

    // Save to storage
    this.saveToStorage();

    return newTemplate;
  }

  /**
   * Load template from library
   */
  loadTemplate(id: string): UserTemplate | undefined {
    return this.library.templates.find((t) => t.id === id);
  }

  /**
   * Delete template from library
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const index = this.library.templates.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.library.templates.splice(index, 1);
      this.updateCategoriesAndTags();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Get all templates
   */
  getAllTemplates(): UserTemplate[] {
    return [...this.library.templates];
  }

  /**
   * Get templates filtered by criteria
   */
  getTemplates(filter?: TemplateFilter): UserTemplate[] {
    let filtered = [...this.library.templates];

    if (!filter) return filtered;

    if (filter.category) {
      filtered = filtered.filter((t) => t.category === filter.category);
    }

    if (filter.platform) {
      filtered = filtered.filter((t) => t.platform === filter.platform);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter((t) =>
        filter.tags!.some((tag) => t.tags.includes(tag))
      );
    }

    if (filter.isPublic !== undefined) {
      filtered = filtered.filter((t) => t.isPublic === filter.isPublic);
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter((t) =>
        t.name.toLowerCase().includes(searchLower) ||
        (t.description && t.description.toLowerCase().includes(searchLower)) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort by updated date (newest first)
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return filtered;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string): UserTemplate[] {
    return this.getTemplates({ category });
  }

  /**
   * Get templates by platform
   */
  getTemplatesByPlatform(platform: string): UserTemplate[] {
    return this.getTemplates({ platform });
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return [...this.library.categories];
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    return [...this.library.tags];
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(): string {
    return JSON.stringify(this.library, null, 2);
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(json: string): Promise<void> {
    try {
      const importedLibrary: TemplateLibrary = JSON.parse(json);

      // Merge with existing library
      const existingIds = new Set(this.library.templates.map((t) => t.id));
      const newTemplates = importedLibrary.templates.filter((t) => !existingIds.has(t.id));

      this.library.templates.push(...newTemplates);
      this.updateCategoriesAndTags();
      this.saveToStorage();
    } catch (error) {
      throw new Error("Failed to import templates: Invalid JSON format");
    }
  }

  /**
   * Duplicate a template
   */
  async duplicateTemplate(id: string, newName?: string): Promise<UserTemplate | undefined> {
    const original = this.loadTemplate(id);
    if (!original) return undefined;

    const duplicated = {
      ...original,
      name: newName || `${original.name} (Copy)`,
      id: undefined as any, // Will be generated
      createdAt: undefined as any, // Will be generated
      updatedAt: undefined as any, // Will be generated
      downloads: 0,
      rating: 0,
    };

    return this.saveTemplate(duplicated);
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, updates: Partial<Omit<UserTemplate, "id" | "createdAt">>): Promise<boolean> {
    const index = this.library.templates.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.library.templates[index] = {
        ...this.library.templates[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.updateCategoriesAndTags();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Rate a template
   */
  async rateTemplate(id: string, rating: number): Promise<boolean> {
    const template = this.loadTemplate(id);
    if (!template) return false;

    // Simple rating system (could be enhanced with user-specific ratings)
    const newRating = ((template.rating || 0) + rating) / 2;
    return this.updateTemplate(id, { rating: newRating });
  }

  /**
   * Increment download count
   */
  async incrementDownloads(id: string): Promise<boolean> {
    const template = this.loadTemplate(id);
    if (!template) return false;

    return this.updateTemplate(id, {
      downloads: (template.downloads || 0) + 1,
    });
  }

  /**
   * Create template from cover generation result
   */
  async createTemplateFromResult(
    name: string,
    platform: string,
    customizations: CoverCustomizations,
    textElements: TextElement[],
    preview?: string,
    options?: {
      description?: string;
      category?: string;
      tags?: string[];
      isPublic?: boolean;
      author?: string;
    }
  ): Promise<UserTemplate> {
    return this.saveTemplate({
      name,
      description: options?.description,
      category: options?.category || "custom",
      tags: options?.tags || [],
      platform,
      preview,
      customizations,
      textElements,
      isPublic: options?.isPublic || false,
      author: options?.author,
    });
  }

  /**
   * Generate statistics about the template library
   */
  getStatistics(): {
    totalTemplates: number;
    publicTemplates: number;
    privateTemplates: number;
    categories: number;
    tags: number;
    platforms: string[];
    topCategories: { category: string; count: number }[];
    topTags: { tag: string; count: number }[];
  } {
    const templates = this.library.templates;
    const publicTemplates = templates.filter((t) => t.isPublic).length;
    const privateTemplates = templates.length - publicTemplates;

    // Category statistics
    const categoryCounts = templates.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Tag statistics
    const tagCounts = templates.reduce((acc, t) => {
      t.tags.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Platform statistics
    const platforms = [...new Set(templates.map((t) => t.platform))];

    return {
      totalTemplates: templates.length,
      publicTemplates,
      privateTemplates,
      categories: this.library.categories.length,
      tags: this.library.tags.length,
      platforms,
      topCategories,
      topTags,
    };
  }

  /**
   * Clear all templates (use with caution)
   */
  clearAllTemplates(): void {
    this.library = {
      templates: [],
      categories: [],
      tags: [],
    };
    this.saveToStorage();
  }

  /**
   * Load templates from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.library = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.library.templates = this.library.templates.map((t) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }));
      }
    } catch (error) {
      console.error("Failed to load templates from storage:", error);
      this.library = {
        templates: [],
        categories: [],
        tags: [],
      };
    }
  }

  /**
   * Save templates to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.library));
    } catch (error) {
      console.error("Failed to save templates to storage:", error);
    }
  }

  /**
   * Update categories and tags based on current templates
   */
  private updateCategoriesAndTags(): void {
    const categories = new Set<string>();
    const tags = new Set<string>();

    this.library.templates.forEach((template) => {
      categories.add(template.category);
      template.tags.forEach((tag) => tags.add(tag));
    });

    this.library.categories = Array.from(categories).sort();
    this.library.tags = Array.from(tags).sort();
  }
}

/**
 * Factory function to create user template manager
 */
export function createUserTemplateManager(): UserTemplateManager {
  return new UserTemplateManager();
}

/**
 * Predefined template categories
 */
export const TEMPLATE_CATEGORIES = [
  "minimal",
  "bold",
  "elegant",
  "creative",
  "professional",
  "seasonal",
  "business",
  "personal",
  "social",
  "marketing",
] as const;

/**
 * Common template tags
 */
export const COMMON_TAGS = [
  "text-heavy",
  "image-focus",
  "colorful",
  "monochrome",
  "modern",
  "vintage",
  "playful",
  "serious",
  "corporate",
  "casual",
  "header",
  "poster",
  "thumbnail",
  "banner",
] as const;