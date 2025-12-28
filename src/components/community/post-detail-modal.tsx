"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Eye, Download, Send, X, User } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

interface PostDetail {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  platformId: string;
  prompt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  isLiked?: boolean;
  comments: Comment[];
}

export function PostDetailModal() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [open, setOpen] = useState(!!postId);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPostDetail();
    }
  }, [postId]);

  const loadPostDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/community/${postId}`);
      if (!response.ok) throw new Error("Failed to load post");

      const data = await response.json();
      setPost(data.post);
      setOpen(true);
    } catch (error) {
      console.error("Failed to load post detail:", error);
      toast.error("加载帖子详情失败");
      setOpen(false);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const response = await fetch(`/api/community/${postId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like post");

      const data = await response.json();
      setPost({
        ...post,
        likeCount: data.likeCount,
        isLiked: data.liked,
      });
    } catch (error) {
      console.error("Failed to like post:", error);
      toast.error("点赞失败");
    }
  };

  const handleDownload = () => {
    if (!post) return;
    const a = document.createElement("a");
    a.href = post.imageUrl;
    a.download = `${post.user.name}_${post.title}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("下载成功");
  };

  const handleShare = async () => {
    if (!post) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description || post.prompt,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("链接已复制");
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/community/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (!response.ok) throw new Error("Failed to submit comment");

      const data = await response.json();
      setPost({
        ...post,
        comments: [data.comment, ...post.comments],
        commentCount: post.commentCount + 1,
      });
      setCommentText("");
      toast.success("评论已发布");
    } catch (error) {
      console.error("Failed to submit comment:", error);
      toast.error("评论失败");
    } finally {
      setSubmittingComment(false);
    }
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

  if (!post && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : post ? (
          <div className="flex h-full">
            {/* Left: Image */}
            <div className="flex-1 bg-black flex items-center justify-center p-8">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Right: Details & Comments */}
            <div className="w-[450px] flex flex-col bg-white">
              {/* Header */}
              <DialogHeader className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.user.image} />
                      <AvatarFallback>
                        {post.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-slate-900">{post.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </DialogHeader>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Post Info */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{post.title}</h2>
                  {post.description && (
                    <p className="text-slate-600 mb-3">{post.description}</p>
                  )}
                  <Badge variant="secondary" className="mb-3">
                    {getPlatformName(post.platformId)}
                  </Badge>
                  <div className="text-sm text-slate-500">
                    <p className="font-medium mb-1">原始提示词：</p>
                    <p className="italic">&quot;{post.prompt}&quot;</p>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-slate-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likeCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4">
                    评论 ({post.commentCount})
                  </h3>
                  {post.comments.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      还没有评论，来抢沙发吧！
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user.image} />
                            <AvatarFallback>
                              <User className="w-4 h-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm text-slate-900">
                                {comment.user.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(comment.createdAt), {
                                  addSuffix: true,
                                  locale: zhCN,
                                })}
                              </p>
                            </div>
                            <p className="text-sm text-slate-700">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Actions & Comment Input */}
              <div className="border-t p-4 space-y-3">
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={post.isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className="flex-1"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
                    {post.isLiked ? "已赞" : "点赞"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare} className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    分享
                  </Button>
                </div>

                {/* Comment Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="写下你的评论..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
