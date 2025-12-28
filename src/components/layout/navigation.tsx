"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Sparkles, Home, Image, Palette, Settings, User, LogOut, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useResponsive, touchFriendly } from "@/hooks/use-responsive";
import { ThemeToggle, CompactThemeToggle } from "@/components/theme/theme-toggle";

const navigation = [
  { name: "首页", href: "/", icon: Home },
  { name: "创建封面", href: "/generate", icon: Sparkles },
  { name: "我的作品", href: "/gallery", icon: Image },
  { name: "模板", href: "/templates", icon: Palette },
  { name: "设置", href: "/settings", icon: Settings },
];

interface NavigationProps {
  className?: string;
}

export function Navigation({ className }: NavigationProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isMobile: rawIsMobile, isTablet: rawIsTablet } = useResponsive();

  // 确保客户端挂载后再应用响应式布局，避免 Hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  // 在挂载前使用默认值（桌面端布局），保证 SSR 与客户端首次渲染一致
  const isMobile = mounted ? rawIsMobile : false;
  const isTablet = mounted ? rawIsTablet : false;

  if (isMobile || isTablet) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "shrink-0",
              touchFriendly.button,
              className
            )}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2 py-4 border-b">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">AI 封面生成器</span>
            </div>
            <div className="flex flex-col gap-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      touchFriendly.interactive,
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              touchFriendly.interactive,
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
      <div className="ml-2 flex items-center gap-2">
        <ThemeToggle />
        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="h-4 w-4" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {session.user.name || session.user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/pricing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="default">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
        )}
      </div>
    </nav>
  );
}

export function MobileHeader() {
  const [mounted, setMounted] = useState(false);
  const { isMobile } = useResponsive();

  // 确保组件在客户端挂载后再进行条件渲染，避免 Hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  // 服务端渲染和客户端首次渲染都返回 null，等待挂载后再决定是否显示
  if (!mounted || !isMobile) return null;

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
      <Navigation />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">AI 封面生成器</h1>
      </div>
      <CompactThemeToggle />
    </header>
  );
}