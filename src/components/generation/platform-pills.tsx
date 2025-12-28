'use client';

/**
 * 平台选择器胶囊组件
 * 紧凑型多选器，适合嵌入工具栏使用
 */

import { Platform } from '@/types';
import { PLATFORMS } from '@/lib/platforms/specs';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// ==================== 类型定义 ====================

interface PlatformPillsProps {
    /** 已选中的平台 ID 列表 */
    selectedPlatforms: string[];
    /** 选中变化回调 */
    onPlatformsChange: (platforms: string[]) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义样式类名 */
    className?: string;
    /** 最大显示数量，超出显示 +N */
    maxVisible?: number;
}

// ==================== 平台图标颜色映射 ====================

const PLATFORM_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
    xiaohongshu: { bg: 'bg-red-50', text: 'text-red-700', icon: '📕' },
    douyin: { bg: 'bg-slate-900', text: 'text-white', icon: '🎵' },
    wechat: { bg: 'bg-green-50', text: 'text-green-700', icon: '💬' },
    'wechat-banner': { bg: 'bg-green-50', text: 'text-green-700', icon: '💬' },
    weibo: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '📢' },
    taobao: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🛒' },
    'taobao-banner': { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🛒' },
    bilibili: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📺' },
    zhihu: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '❓' },
};

// ==================== 主组件 ====================

export function PlatformPills({
    selectedPlatforms,
    onPlatformsChange,
    disabled = false,
    className,
    maxVisible = 6,
}: PlatformPillsProps) {
    // 单选模式：点击其他平台时直接替换当前选择
    const togglePlatform = (platformId: string) => {
        if (disabled) return;

        // 如果点击的是已选中的平台，不做任何操作（保持选中）
        if (selectedPlatforms.includes(platformId)) {
            return;
        }
        // 否则替换为新平台（单选）
        onPlatformsChange([platformId]);
    };

    // 过滤主要平台（排除变体版本，保持简洁）
    const primaryPlatforms = PLATFORMS.filter(
        (p) => !p.id.includes('-vertical') && !p.id.includes('-banner')
    );

    const visiblePlatforms = primaryPlatforms.slice(0, maxVisible);
    const hiddenCount = primaryPlatforms.length - maxVisible;

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {visiblePlatforms.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const colors = PLATFORM_COLORS[platform.id] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    icon: '📱',
                };

                return (
                    <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        disabled={disabled}
                        className={cn(
                            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                            'transition-all duration-200 ease-out',
                            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                            isSelected
                                ? 'bg-violet-600 text-white shadow-md hover:bg-violet-700'
                                : cn(colors.bg, colors.text, 'hover:ring-2 hover:ring-violet-300'),
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span className="text-base leading-none">{colors.icon}</span>
                        <span>{platform.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                );
            })}

            {/* 显示更多平台的提示 */}
            {hiddenCount > 0 && (
                <span className="text-xs text-slate-500 px-2">+{hiddenCount} 更多</span>
            )}

            {/* 无选择提示 */}
            {selectedPlatforms.length === 0 && (
                <span className="text-xs text-amber-600 ml-2">请选择至少一个平台</span>
            )}
        </div>
    );
}

// ==================== 完整版选择器（带变体） ====================

interface PlatformPillsFullProps extends PlatformPillsProps {
    /** 是否显示平台变体（如竖版、横幅等） */
    showVariants?: boolean;
}

export function PlatformPillsFull({
    selectedPlatforms,
    onPlatformsChange,
    disabled = false,
    className,
    showVariants = true,
}: PlatformPillsFullProps) {
    // 单选模式：点击其他平台时直接替换当前选择
    const togglePlatform = (platformId: string) => {
        if (disabled) return;

        // 如果点击的是已选中的平台，不做任何操作（保持选中）
        if (selectedPlatforms.includes(platformId)) {
            return;
        }
        // 否则替换为新平台（单选）
        onPlatformsChange([platformId]);
    };

    const platformsToShow = showVariants
        ? PLATFORMS
        : PLATFORMS.filter((p) => !p.id.includes('-vertical') && !p.id.includes('-banner'));

    return (
        <div className={cn('flex flex-wrap items-center gap-2', className)}>
            {platformsToShow.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id);
                const baseId = platform.id.split('-')[0];
                const colors = PLATFORM_COLORS[baseId] || PLATFORM_COLORS[platform.id] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    icon: '📱',
                };

                return (
                    <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        disabled={disabled}
                        className={cn(
                            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium',
                            'transition-all duration-200 ease-out',
                            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
                            isSelected
                                ? 'bg-violet-600 text-white shadow-md hover:bg-violet-700'
                                : cn(colors.bg, colors.text, 'hover:ring-2 hover:ring-violet-300'),
                            disabled && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span className="text-base leading-none">{colors.icon}</span>
                        <span>{platform.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                );
            })}
        </div>
    );
}

export default PlatformPills;
