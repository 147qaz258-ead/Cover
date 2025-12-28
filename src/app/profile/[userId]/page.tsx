"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Heart, Users, Calendar, Settings, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  name: string;
  image?: string;
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface Post {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl: string;
  platformId: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "liked">("posts");

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadUserPosts();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error("Failed to load user profile");

      const data = await response.json();
      setUser(data.user);
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast.error("加载用户资料失败");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (type: "posts" | "liked" = "posts") => {
    try {
      const response = await fetch(`/api/users/${userId}/posts?type=${type}`);
      if (!response.ok) throw new Error("Failed to load user posts");

      const data = await response.json();
      if (type === "posts") {
        setPosts(data.posts || []);
      } else {
        setLikedPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to load user posts:", error);
      toast.error("加载作品失败");
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to follow user");

      const data = await response.json();
      setIsFollowing(data.following);
      if (data.following) {
        toast.success("已关注");
        setUser((prev) => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers + 1 } } : null);
      } else {
        toast.success("已取消关注");
        setUser((prev) => prev ? { ...prev, _count: { ...prev._count, followers: prev._count.followers - 1 } } : null);
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
      toast.error("操作失败");
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "posts" | "liked");
    loadUserPosts(value as "posts" | "liked");
  };

  const handlePostClick = (post: Post) => {
    router.push(`/community/post/${post.id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">用户不存在</h2>
            <Button asChild>
              <Link href="/community">返回社区</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayPosts = activeTab === "posts" ? posts : likedPosts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/community">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <h1 className="text-lg font-semibold text-slate-900">用户资料</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                {user.image ? (
                  <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      加入于 {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                  </div>
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="flex-shrink-0"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {isFollowing ? "已关注" : "关注"}
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-1">
                    <Grid className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">{user._count.posts}</span>
                    <span className="text-sm text-slate-500">作品</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">{user._count.followers}</span>
                    <span className="text-sm text-slate-500">粉丝</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-slate-900">{user._count.following}</span>
                    <span className="text-sm text-slate-500">关注</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              作品 ({user._count.posts})
            </TabsTrigger>
            <TabsTrigger value="liked" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              喜欢
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {displayPosts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Grid className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">还没有发布作品</h3>
                  <p className="text-slate-600">等待用户分享第一件作品吧</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden">
                      <img
                        src={post.thumbnailUrl || post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-slate-900 text-sm truncate mb-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <Badge variant="secondary" className="text-[10px]">
                          {getPlatformName(post.platformId)}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likeCount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-6">
            {displayPosts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">还没有喜欢的作品</h3>
                  <p className="text-slate-600">喜欢的作品会显示在这里</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handlePostClick(post)}
                  >
                    <div className="aspect-square bg-slate-100 overflow-hidden">
                      <img
                        src={post.thumbnailUrl || post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-slate-900 text-sm truncate mb-1">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <Badge variant="secondary" className="text-[10px]">
                          {getPlatformName(post.platformId)}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                          {post.likeCount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
