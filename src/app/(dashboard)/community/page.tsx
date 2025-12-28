"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Filter, Users, Heart, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MasonryGrid } from "@/components/gallery/masonry-grid";
import { CoverGenerationResult } from "@/types";
import { toast } from "sonner";

interface CommunityPost {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  platformId: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  isLiked?: boolean;
}

export default function CommunityPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [selectedPlatform, sortBy, page]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
      });
      if (selectedPlatform !== "all") {
        params.append("platform", selectedPlatform);
      }

      const response = await fetch(`/api/community?${params}`);
      if (!response.ok) throw new Error("Failed to load posts");

      const data = await response.json();
      setPosts(data.posts || []);
      setHasMore(data.pagination?.totalPages > page);
    } catch (error) {
      console.error("Failed to load community posts:", error);
      toast.error("加载社区内容失败");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/${postId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like post");

      const data = await response.json();
      setPosts(posts.map((post) =>
        post.id === postId
          ? { ...post, likeCount: data.likeCount, isLiked: data.liked }
          : post
      ));
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error("点赞失败");
    }
  };

  const handleDownload = (post: CommunityPost) => {
    const a = document.createElement("a");
    a.href = post.imageUrl;
    a.download = `${post.user.name}_${post.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("下载成功");
  };

  const handlePreview = (post: CommunityPost) => {
    // Open in lightbox (handled by post detail modal)
    router.push(`/community/post/${post.id}`);
  };

  const handleReEdit = (post: CommunityPost) => {
    // Create a CoverGenerationResult-like object from the post
    const item: Partial<CoverGenerationResult> = {
      id: post.id,
      title: post.title,
      imageUrl: post.imageUrl,
      platform: { id: post.platformId, name: getPlatformName(post.platformId) } as any,
      inputText: post.description || post.title,
    };
    sessionStorage.setItem("re-edit-item", JSON.stringify(item));
    router.push("/generate");
    toast.success("已加载模板，开始生成");
  };

  const getPlatformName = (platformId: string): string => {
    const names: Record<string, string> = {
      xiaohongshu: "小红书",
      wechat: "微信",
      douyin: "抖音",
      taobao: "淘宝",
    };
    return names[platformId] || platformId;
  };

  // Convert CommunityPost to CoverGenerationResult for MasonryGrid
  const masonryItems: CoverGenerationResult[] = posts.map((post) => ({
    id: post.id,
    title: post.title,
    subtitle: post.description,
    imageUrl: post.imageUrl,
    thumbnailUrl: post.thumbnailUrl,
    platform: { id: post.platformId, name: getPlatformName(post.platformId) } as any,
    template: { id: "community", name: "社区分享" } as any,
    createdAt: post.createdAt,
    metadata: {
      fileSize: 0,
      format: "png",
      dimensions: { width: 0, height: 0 },
    },
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/generate">
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              <h1 className="text-lg font-semibold text-slate-900">社区灵感</h1>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            {/* Sort By */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as "latest" | "popular");
                  setPage(1);
                }}
                className="text-sm border-0 bg-transparent text-slate-700 focus:ring-0 cursor-pointer"
              >
                <option value="latest">最新发布</option>
                <option value="popular">最受欢迎</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={selectedPlatform}
                onChange={(e) => {
                  setSelectedPlatform(e.target.value);
                  setPage(1);
                }}
                className="text-sm border-0 bg-transparent text-slate-700 focus:ring-0 cursor-pointer"
              >
                <option value="all">全部平台</option>
                <option value="xiaohongshu">小红书</option>
                <option value="wechat">微信</option>
                <option value="douyin">抖音</option>
                <option value="taobao">淘宝</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Description */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            探索社区创作的精彩封面
          </h2>
          <p className="text-slate-600">
            汲取灵感，发现创意，与创作者们一起成长
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          // Empty state
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              暂无社区内容
            </h3>
            <p className="text-slate-600 mb-6">
              成为第一个分享作品的人吧！
            </p>
            <Button asChild>
              <Link href="/generate">
                <Sparkles className="w-4 h-4 mr-2" />
                开始生成
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                共 <span className="font-semibold text-slate-900">{posts.length}</span> 个作品
              </p>
            </div>

            {/* Masonry Grid with social features */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {masonryItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-square bg-slate-100 overflow-hidden cursor-pointer" onClick={() => handlePreview(posts.find((p) => p.id === item.id)!)}>
                    <img
                      src={item.thumbnailUrl || item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(posts.find((p) => p.id === item.id)!);
                        }}
                      >
                        查看详情
                      </Button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-slate-900 text-sm truncate mb-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.platform.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {posts.find((p) => p.id === item.id)?.likeCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Like button */}
                  <button
                    onClick={() => handleLike(item.id)}
                    className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
                      posts.find((p) => p.id === item.id)?.isLiked
                        ? "bg-red-500 text-white"
                        : "bg-white/90 text-slate-600 hover:bg-red-50"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${posts.find((p) => p.id === item.id)?.isLiked ? "fill-current" : ""}`} />
                  </button>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                >
                  {loading ? "加载中..." : "加载更多"}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
