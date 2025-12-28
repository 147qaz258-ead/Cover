"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  // 兼容 next-themes API
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize theme from localStorage or default
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Effect to apply theme to document and resolve system theme
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove previous theme classes
    root.classList.remove("light", "dark");

    // Resolve system theme
    let newResolvedTheme: "light" | "dark";
    if (theme === "system") {
      newResolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      newResolvedTheme = theme;
    }

    // Apply theme class
    root.classList.add(newResolvedTheme);
    root.setAttribute("data-theme", newResolvedTheme);
    setResolvedTheme(newResolvedTheme);

    // Store theme preference
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, theme);
    }
  }, [theme, storageKey]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      const handleChange = () => {
        const newResolvedTheme = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(newResolvedTheme);

        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        root.classList.add(newResolvedTheme);
        root.setAttribute("data-theme", newResolvedTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(currentTheme => {
      if (currentTheme === "light") return "dark";
      if (currentTheme === "dark") return "light";
      // If system, toggle to opposite of current resolved
      return resolvedTheme === "light" ? "dark" : "light";
    });
  };

  const value = {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Theme-aware hook for CSS variables
export function useThemeVariables() {
  const { isDark } = useTheme();

  const getVariable = (variable: string) => {
    if (typeof window !== "undefined") {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--${variable}`)
        .trim();
    }
    return "";
  };

  // Common theme variables
  const variables = {
    background: getVariable("background"),
    foreground: getVariable("foreground"),
    card: getVariable("card"),
    cardForeground: getVariable("card-foreground"),
    popover: getVariable("popover"),
    popoverForeground: getVariable("popover-foreground"),
    primary: getVariable("primary"),
    primaryForeground: getVariable("primary-foreground"),
    secondary: getVariable("secondary"),
    secondaryForeground: getVariable("secondary-foreground"),
    muted: getVariable("muted"),
    mutedForeground: getVariable("muted-foreground"),
    accent: getVariable("accent"),
    accentForeground: getVariable("accent-foreground"),
    destructive: getVariable("destructive"),
    destructiveForeground: getVariable("destructive-foreground"),
    border: getVariable("border"),
    input: getVariable("input"),
    ring: getVariable("ring"),
    radius: getVariable("radius"),
  };

  return {
    variables,
    isDark,
    setVariable: (name: string, value: string) => {
      if (typeof window !== "undefined") {
        document.documentElement.style.setProperty(`--${name}`, value);
      }
    },
  };
}

// Theme animation hook
export function useThemeTransition() {
  const { resolvedTheme, isDark } = useTheme();

  const animateThemeChange = () => {
    const root = document.documentElement;

    // Add transition class
    root.style.transition = "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease";

    // Remove transition after animation
    setTimeout(() => {
      root.style.transition = "";
    }, 300);
  };

  return {
    animateThemeChange,
    isDark,
    resolvedTheme,
  };
}