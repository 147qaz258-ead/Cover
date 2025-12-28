/**
 * 提示词加载器
 * 负责加载 .txt 提示词文件并进行变量插值
 */

import fs from 'fs';
import path from 'path';

// ==================== 常量配置 ====================

/** 提示词文件基础目录 */
const PROMPTS_DIR = path.join(process.cwd(), 'src/lib/ai/prompts');

// ==================== 缓存 ====================

/** 生产环境缓存 */
const promptCache = new Map<string, string>();

// ==================== 核心函数 ====================

/**
 * 加载提示词文件
 * 生产环境使用缓存，开发环境每次读取最新内容
 */
export function loadPrompt(filename: string): string {
    const useCache = process.env.NODE_ENV === 'production';

    // 检查缓存
    if (useCache && promptCache.has(filename)) {
        console.log(`[PromptLoader] 📦 从缓存加载: ${filename}`);
        return promptCache.get(filename)!;
    }

    // 构建文件路径
    const promptPath = path.join(PROMPTS_DIR, filename);

    // 文件存在性校验
    if (!fs.existsSync(promptPath)) {
        throw new Error(`[PromptLoader] 文件不存在: ${filename}`);
    }

    // 读取文件内容
    const content = fs.readFileSync(promptPath, 'utf-8');
    console.log(`[PromptLoader] 📄 加载: ${filename} (${content.length} 字符)`);

    // 生产环境写入缓存
    if (useCache) {
        promptCache.set(filename, content);
    }

    return content;
}

/**
 * 变量插值
 * 将模板中的 {variable} 替换为实际值
 */
export function interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(
        /\{(\w+)\}/g,
        (match, key) => vars[key] ?? match
    );
}

/**
 * 加载并插值
 * 一步完成加载和变量替换
 */
export function loadAndInterpolate(filename: string, vars: Record<string, string>): string {
    const template = loadPrompt(filename);
    return interpolate(template, vars);
}

/**
 * 清除缓存（用于测试或热更新）
 */
export function clearPromptCache(): void {
    promptCache.clear();
    console.log('[PromptLoader] 🗑️ 缓存已清除');
}
