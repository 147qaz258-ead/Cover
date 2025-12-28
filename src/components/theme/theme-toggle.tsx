"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>浅色</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>深色</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>跟随系统</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple theme toggle button (no dropdown)
export function ThemeToggleButton() {
  const { theme, setTheme, toggleTheme } = useTheme();

  const handleToggle = () => {
    // Cycle through themes: light -> dark -> system -> light
    if (theme === "light") {
      toggleTheme(); // Will go to dark
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getIcon = () => {
    if (theme === "light") return <Sun className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === "light") return "浅色模式";
    if (theme === "dark") return "深色模式";
    return "跟随系统";
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="w-full justify-start"
    >
      {getIcon()}
      <span className="ml-2">{getLabel()}</span>
    </Button>
  );
}

// Compact theme toggle for mobile
export function CompactThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">切换主题</span>
    </Button>
  );
}

// Theme toggle with animation
export function AnimatedThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="relative overflow-hidden"
    >
      <div className="relative z-10 flex items-center">
        {isDark ? (
          <>
            <Moon className="h-4 w-4 mr-2" />
            <span>深色模式</span>
          </>
        ) : (
          <>
            <Sun className="h-4 w-4 mr-2" />
            <span>浅色模式</span>
          </>
        )}
      </div>
      <div
        className={`absolute inset-0 bg-primary text-primary-foreground transition-transform duration-300 ${isDark ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-center h-full">
          {isDark ? (
            <>
              <Moon className="h-4 w-4 mr-2" />
              <span>深色模式</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 mr-2" />
              <span>浅色模式</span>
            </>
          )}
        </div>
      </div>
    </Button>
  );
}