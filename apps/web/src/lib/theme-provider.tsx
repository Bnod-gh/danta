"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "danta-theme";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function getStoredTheme(): Theme {
  try {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
  } catch {
    return "system";
  }
}

function resolveToTheme(theme: Theme): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  if (theme === "system") {
    return window.matchMedia(SYSTEM_QUERY).matches ? "dark" : "light";
  }
  return theme;
}

interface ThemeContextValue {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "system",
  resolved: "light",
  setTheme: () => undefined,
  toggle: () => undefined,
});

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = React.useState<Theme>(getStoredTheme);
  const [mounted, setMounted] = React.useState(false);

  const resolved = React.useMemo(() => resolveToTheme(theme), [theme]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  }, [resolved]);

  React.useEffect(() => setMounted(true), []);

  const updateTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    setTheme(next);
  }, []);

  const toggle = React.useCallback(() => {
    updateTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, updateTheme]);

  return (
    <ThemeContext.Provider
      value={React.useMemo(
        () => ({
          theme,
          resolved,
          setTheme: updateTheme,
          toggle,
        }),
        [theme, resolved, updateTheme, toggle]
      )}
    >
      {mounted ? children : children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

export function useResolvedTheme() {
  return useTheme().resolved;
}
