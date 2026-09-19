"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function domTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Must start with the same value on the server and on the client's first
  // render, or React reports a hydration mismatch. The real theme is already
  // applied to <html> by the pre-paint script in layout.tsx; we adopt it below
  // once mounted. Until then `resolved` is false.
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setThemeState(domTheme());
    setResolved(true);
  }, []);

  useEffect(() => {
    // Skip the pre-resolution pass, otherwise the default "light" above would
    // strip the `dark` class the pre-paint script just set.
    if (!resolved) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // Private mode / blocked storage - theme still applies for this session.
    }
  }, [theme, resolved]);

  // Read from the DOM rather than state so a click that lands before the
  // mount effect runs still toggles in the right direction.
  const toggleTheme = () => {
    setThemeState(domTheme() === "dark" ? "light" : "dark");
    setResolved(true);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setResolved(true);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
