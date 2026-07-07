import React, { createContext, useContext, useState } from "react";

export type LayoutId = "detailed" | "focus" | "simple";

export interface LayoutMeta {
  id: LayoutId;
  label: string;
  description: string;
}

export const LAYOUTS: LayoutMeta[] = [
  {
    id: "detailed",
    label: "Detailed",
    description: "Multi-panel dashboard. Maximum information and analytics visible.",
  },
  {
    id: "focus",
    label: "Focus",
    description: "Single column. Reduced density, minimal distractions.",
  },
  {
    id: "simple",
    label: "Simple",
    description: "Two-panel cards. Friendly and approachable for everyday use.",
  },
];

const STORAGE_KEY = "mindline-layout";
const DEFAULT_LAYOUT: LayoutId = "detailed";

interface LayoutContextValue {
  layoutId: LayoutId;
  setLayoutId: (id: LayoutId) => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  layoutId: DEFAULT_LAYOUT,
  setLayoutId: () => {},
});

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [layoutId, setLayoutIdState] = useState<LayoutId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LayoutId | null;
      if (stored && LAYOUTS.find((l) => l.id === stored)) return stored;
    } catch {}
    return DEFAULT_LAYOUT;
  });

  const setLayoutId = (id: LayoutId) => {
    setLayoutIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  };

  return (
    <LayoutContext.Provider value={{ layoutId, setLayoutId }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  return useContext(LayoutContext);
}
