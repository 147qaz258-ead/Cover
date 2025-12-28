// ==================== 预定义图像模型配置 ====================
// 所有支持的图像生成模型列表

import type { ImageModelConfig } from "./model-config";

/**
 * 图像模型配置列表
 * 按 priority 排序，数值越小优先级越高
 */
export const IMAGE_MODELS: ImageModelConfig[] = [
    // ==================== 首选：老张 API 中转 Gemini ====================
    {
        id: "laozhang/gemini-3-pro-image-preview",  // 渠道：老张中转
        name: "Nano Banana Pro",
        provider: "openai-compatible",
        displayProvider: "google",  // 模型归属：Google
        endpoint: {
            baseURL: "https://api.laozhang.ai/v1",
            apiKeyEnv: "LAOZHANG_API_KEY",
        },
        model: "gemini-3-pro-image-preview",
        capabilities: {
            aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
        },
        priority: 0, // 最高优先级
        isDefault: true,
        fallbackTo: "laozhang/flux-kontext-pro",
    },

    // ==================== 备选 1：老张 API Flux ====================
    {
        id: "laozhang/flux-kontext-pro",
        name: "Flux Kontext Pro",
        provider: "openai-compatible",
        displayProvider: "flux",  // 模型归属：Flux (Black Forest Labs)
        endpoint: {
            baseURL: "https://api.laozhang.ai/v1",
            apiKeyEnv: "LAOZHANG_API_KEY",
        },
        model: "flux-kontext-pro",
        capabilities: {
            aspectRatios: [
                "1:1",
                "2:3",
                "3:2",
                "4:3",
                "3:4",
                "16:9",
                "9:16",
                "21:9",
                "5:4",
                "4:5",
                "16:10",
                "3:7",
                "7:3",
            ],
        },
        extraParams: {
            prompt_upsampling: true,
            safety_tolerance: 2,
        },
        priority: 1,
        fallbackTo: "google/gemini-3-pro-image-preview", // 如果老张挂了，尝试官方
    },

    // ==================== 备选 2：老张 API GPT-4o ====================
    {
        id: "laozhang/gpt-4o-image",
        name: "GPT-4o Image",
        provider: "openai-compatible",
        displayProvider: "openai",  // 模型归属：OpenAI
        endpoint: {
            baseURL: "https://api.laozhang.ai/v1",
            apiKeyEnv: "LAOZHANG_API_KEY",
        },
        model: "gpt-4o-image",
        capabilities: {
            sizes: ["1024x1024", "1024x1792", "1792x1024"],
        },
        priority: 2,
        fallbackTo: "openai/dall-e-3",
    },

    {
        id: "laozhang/flux-kontext-max",
        name: "Flux Kontext Max",
        provider: "openai-compatible",
        displayProvider: "flux",  // 模型归属：Flux (Black Forest Labs)
        endpoint: {
            baseURL: "https://api.laozhang.ai/v1",
            apiKeyEnv: "LAOZHANG_API_KEY",
        },
        model: "flux-kontext-max",
        capabilities: {
            aspectRatios: [
                "1:1",
                "2:3",
                "3:2",
                "4:3",
                "3:4",
                "16:9",
                "9:16",
                "21:9",
                "5:4",
                "4:5",
            ],
        },
        extraParams: {
            prompt_upsampling: true,
            safety_tolerance: 2,
        },
        priority: 3,
        fallbackTo: "laozhang/flux-kontext-pro",
    },

    {
        id: "laozhang/gemini-2.5-flash-image",  // 渠道：老张中转
        name: "Nano Banana",
        provider: "openai-compatible",
        displayProvider: "google",  // 模型归属：Google
        endpoint: {
            baseURL: "https://api.laozhang.ai/v1",
            apiKeyEnv: "LAOZHANG_API_KEY",
        },
        model: "gemini-2.5-flash-image",
        capabilities: {
            aspectRatios: ["1:1", "16:9", "9:16"],
        },
        priority: 4,
        fallbackTo: "laozhang/flux-kontext-pro",
    },

    // ==================== Google Gemini ====================
    {
        id: "google/gemini-3-pro-image-preview",  // 渠道：Google 官方
        name: "Nano Banana Pro",
        provider: "gemini",
        displayProvider: "google",
        endpoint: {
            baseURL: "https://generativelanguage.googleapis.com",
            apiKeyEnv: "GOOGLE_AI_API_KEY",
        },
        model: "gemini-3-pro-image-preview",
        capabilities: {
            aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
            maxResolution: "4K",
        },
        priority: 5,
        isDefault: true,
        fallbackTo: "laozhang/flux-kontext-pro",
    },
    {
        id: "google/gemini-2.5-flash-image",  // 渠道：Google 官方
        name: "Nano Banana",
        provider: "gemini",
        displayProvider: "google",
        endpoint: {
            baseURL: "https://generativelanguage.googleapis.com",
            apiKeyEnv: "GOOGLE_AI_API_KEY",
        },
        model: "gemini-2.5-flash-image",
        capabilities: {
            aspectRatios: ["1:1", "16:9", "9:16"],
        },
        priority: 6,
        fallbackTo: "laozhang/flux-kontext-pro",
    },

    // ==================== 官方 OpenAI ====================
    {
        id: "openai/dall-e-3",
        name: "DALL-E 3",
        provider: "openai-compatible",
        displayProvider: "openai",
        endpoint: {
            baseURL: "https://api.openai.com/v1",
            apiKeyEnv: "OPENAI_API_KEY",
        },
        model: "dall-e-3",
        capabilities: {
            sizes: ["1024x1024", "1024x1792", "1792x1024"],
        },
        priority: 10,
    },
    {
        id: "openai/dall-e-2",
        name: "DALL-E 2",
        provider: "openai-compatible",
        displayProvider: "openai",
        endpoint: {
            baseURL: "https://api.openai.com/v1",
            apiKeyEnv: "OPENAI_API_KEY",
        },
        model: "dall-e-2",
        capabilities: {
            sizes: ["256x256", "512x512", "1024x1024"],
        },
        priority: 15,
        fallbackTo: "openai/dall-e-3",
    },

    // ==================== Replicate ====================
    {
        id: "replicate/stable-diffusion",
        name: "Stable Diffusion XL",
        provider: "replicate",
        endpoint: {
            baseURL: "https://api.replicate.com",
            apiKeyEnv: "REPLICATE_API_TOKEN",
        },
        model: "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
        capabilities: {
            aspectRatios: ["1:1"],
            sizes: ["1024x1024"],
        },
        priority: 20,
    },
];
