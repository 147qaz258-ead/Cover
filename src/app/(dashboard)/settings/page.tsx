"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Settings as SettingsIcon, User, Palette, Database, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const USER_PREFERENCES_KEY = "user_preferences";
const STORAGE_KEY = "cover_generation_history";

interface UserPreferences {
  defaultPlatform: string;
  defaultModel?: string;
  theme: "light" | "dark" | "system";
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultPlatform: "xiaohongshu",
    theme: "system",
  });
  const [storageSize, setStorageSize] = useState<string>("0 KB");

  useEffect(() => {
    loadPreferences();
    calculateStorageSize();
  }, []);

  const loadPreferences = () => {
    try {
      const stored = localStorage.getItem(USER_PREFERENCES_KEY);
      if (stored) {
        const prefs: UserPreferences = JSON.parse(stored);
        setPreferences(prefs);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const savePreferences = (newPrefs: UserPreferences) => {
    try {
      localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(newPrefs));
      setPreferences(newPrefs);
      toast.success("设置已保存");
    } catch (error) {
      toast.error("保存失败");
    }
  };

  const calculateStorageSize = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const sizeInBytes = new Blob([stored]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        setStorageSize(`${sizeInKB} KB`);
      }
    } catch (error) {
      console.error("Failed to calculate storage size:", error);
    }
  };

  const handleClearHistory = () => {
    if (confirm("确定要清空所有生成历史吗？此操作不可恢复。")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        setStorageSize("0 KB");
        toast.success("历史记录已清空");
      } catch (error) {
        toast.error("清空失败");
      }
    }
  };

  const handleExportData = () => {
    try {
      const history = localStorage.getItem(STORAGE_KEY);
      const prefs = localStorage.getItem(USER_PREFERENCES_KEY);

      const data = {
        history: history ? JSON.parse(history) : [],
        preferences: prefs ? JSON.parse(prefs) : {},
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cover-generator-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("数据导出成功");
    } catch (error) {
      toast.error("导出失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/generate">
            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-violet-600" />
            <h1 className="text-lg font-semibold text-slate-900">设置</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">账户</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">偏好</span>
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">存储</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">订阅</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
                <CardDescription>
                  管理您的账户设置和个人信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" placeholder="your@email.com" disabled />
                  <p className="text-xs text-slate-500">
                    登录后可用：账户功能需要登录后才能使用
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">显示名称</Label>
                  <Input id="name" placeholder="您的名称" disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>偏好设置</CardTitle>
                <CardDescription>
                  自定义您的使用体验
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Default Platform */}
                <div className="space-y-2">
                  <Label htmlFor="defaultPlatform">默认平台</Label>
                  <select
                    id="defaultPlatform"
                    value={preferences.defaultPlatform}
                    onChange={(e) =>
                      savePreferences({ ...preferences, defaultPlatform: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="xiaohongshu">小红书</option>
                    <option value="wechat">微信</option>
                    <option value="douyin">抖音</option>
                    <option value="taobao">淘宝</option>
                  </select>
                  <p className="text-xs text-slate-500">
                    每次生成时默认选中的平台
                  </p>
                </div>

                {/* Theme */}
                <div className="space-y-4">
                  <Label>主题</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">深色模式</p>
                        <p className="text-xs text-slate-500">
                          切换深色/浅色主题
                        </p>
                      </div>
                      <Switch
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
                    </div>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="space-y-2">
                  <Label htmlFor="defaultModel">默认模型（可选）</Label>
                  <Input
                    id="defaultModel"
                    placeholder="留空使用系统默认"
                    value={preferences.defaultModel || ""}
                    onChange={(e) =>
                      savePreferences({ ...preferences, defaultModel: e.target.value || undefined })
                    }
                  />
                  <p className="text-xs text-slate-500">
                    设置默认的 AI 图像生成模型
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle>本地存储</CardTitle>
                <CardDescription>
                  管理本地缓存的数据
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Storage Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">历史记录大小：</span>
                    <span className="font-mono text-slate-900">{storageSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">存储位置：</span>
                    <span className="text-slate-500 text-sm">浏览器本地存储</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    className="w-full"
                  >
                    导出数据
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearHistory}
                    className="w-full"
                  >
                    清空历史记录
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    清空历史记录将永久删除所有本地存储的生成历史
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>订阅计划</CardTitle>
                <CardDescription>
                  查看和管理您的订阅
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="p-4 border border-violet-200 rounded-lg bg-violet-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-violet-900">免费计划</h3>
                    <Badge className="bg-violet-100 text-violet-700">当前</Badge>
                  </div>
                  <p className="text-sm text-violet-700 mb-4">
                    每日生成 10 个封面
                  </p>
                  <div className="space-y-1 text-sm text-violet-600">
                    <p>✓ 基础视觉风格</p>
                    <p>✓ 本地存储</p>
                    <p>✓ 标准质量导出</p>
                  </div>
                </div>

                {/* Upgrade CTA */}
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    升级到 Pro 计划可解锁更多功能
                  </p>
                  <Button className="w-full" disabled>
                    <CreditCard className="w-4 h-4 mr-2" />
                    升级到 Pro（即将推出）
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Pro 功能即将上线，敬请期待
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
