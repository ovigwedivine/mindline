import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "terminal" | "soft" | "comfort";
export type StyleProfile = "technical" | "friendly";
export type ColorSchemeId =
  | "default"
  | "ocean-blue"
  | "peach-blossom"
  | "forest-green"
  | "lavender-mist";

export const THEMES: { id: Theme; label: string; description: string; preview: string }[] = [
  {
    id: "terminal",
    label: "Terminal",
    description: "Mono typography, sharp corners, dense spacing.",
    preview: "hsl(160 100% 50%)",
  },
  {
    id: "soft",
    label: "Soft",
    description: "Rounded corners, friendly typography, cozy spacing.",
    preview: "hsl(275 45% 62%)",
  },
  {
    id: "comfort",
    label: "Comfort",
    description: "Balanced radius, warm tones, calm spacing.",
    preview: "hsl(28 58% 44%)",
  },
];

export interface ColorSchemeMeta {
  id: ColorSchemeId;
  label: string;
  description: string;
  preview: string;
  dark: boolean;
}

export const COLOR_SCHEMES: ColorSchemeMeta[] = [
  {
    id: "default",
    label: "Default",
    description: "Uses the theme's built-in palette.",
    preview: "",
    dark: false,
  },
  {
    id: "ocean-blue",
    label: "Ocean Blue",
    description: "Deep navy with electric blue accents. Dark.",
    preview: "hsl(210 100% 60%)",
    dark: true,
  },
  {
    id: "peach-blossom",
    label: "Peach Blossom",
    description: "Warm cream with coral accents. Light.",
    preview: "hsl(8 90% 65%)",
    dark: false,
  },
  {
    id: "forest-green",
    label: "Forest Green",
    description: "Sage tones with forest green accents. Light.",
    preview: "hsl(150 55% 38%)",
    dark: false,
  },
  {
    id: "lavender-mist",
    label: "Lavender Mist",
    description: "Cool lavender with purple accents. Light.",
    preview: "hsl(260 55% 55%)",
    dark: false,
  },
];

const THEME_KEY = "mindline-theme";
const SCHEME_KEY = "mindline-color-scheme";
const DEFAULT_THEME: Theme = "terminal";
const DEFAULT_SCHEME: ColorSchemeId = "default";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  styleProfile: StyleProfile;
  colorScheme: ColorSchemeId;
  setColorScheme: (s: ColorSchemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  styleProfile: "technical",
  colorScheme: DEFAULT_SCHEME,
  setColorScheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const s = localStorage.getItem(THEME_KEY) as Theme | null;
      if (s && THEMES.find((t) => t.id === s)) return s;
    } catch {}
    return DEFAULT_THEME;
  });

  const [colorScheme, setColorSchemeState] = useState<ColorSchemeId>(() => {
    try {
      const s = localStorage.getItem(SCHEME_KEY) as ColorSchemeId | null;
      if (s && COLOR_SCHEMES.find((c) => c.id === s)) return s;
    } catch {}
    return DEFAULT_SCHEME;
  });

  const styleProfile: StyleProfile = theme === "terminal" ? "technical" : "friendly";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    if (colorScheme === "default") {
      document.documentElement.removeAttribute("data-scheme");
    } else {
      document.documentElement.setAttribute("data-scheme", colorScheme);
    }
    try {
      localStorage.setItem(SCHEME_KEY, colorScheme);
    } catch {}
  }, [colorScheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const stored = localStorage.getItem(SCHEME_KEY) as ColorSchemeId | null;
    if (stored && stored !== "default") {
      document.documentElement.setAttribute("data-scheme", stored);
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        styleProfile,
        colorScheme,
        setColorScheme: setColorSchemeState,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
