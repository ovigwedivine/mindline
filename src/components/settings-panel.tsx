import React from "react";
import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme, THEMES, COLOR_SCHEMES } from "@/lib/theme";
import { useLayout, LAYOUTS } from "@/lib/layout-context";
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();
  const { layoutId, setLayoutId } = useLayout();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4 max-h-[80vh] overflow-y-auto" sideOffset={8}>
        <div className="flex flex-col gap-5">

          {/* ── Layout ─────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5 font-medium">
              Layout · Information Density
            </p>
            <div className="flex flex-col gap-1.5">
              {LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLayoutId(l.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border text-left transition-all",
                    layoutId === l.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <div className={cn("h-8 w-10 rounded shrink-0 border border-border flex items-center justify-center", layoutId === l.id ? "bg-primary/20" : "bg-muted")}>
                    {l.id === "detailed" && (
                      <svg viewBox="0 0 20 14" className="w-5 h-4 text-current opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="18" height="12" rx="1" /><line x1="1" y1="4.5" x2="19" y2="4.5" /><line x1="4" y1="8" x2="10" y2="8" /><line x1="4" y1="10.5" x2="14" y2="10.5" />
                      </svg>
                    )}
                    {l.id === "focus" && (
                      <svg viewBox="0 0 20 14" className="w-5 h-4 text-current opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <line x1="4" y1="3" x2="16" y2="3" /><line x1="4" y1="7" x2="16" y2="7" /><line x1="4" y1="11" x2="12" y2="11" />
                      </svg>
                    )}
                    {l.id === "simple" && (
                      <svg viewBox="0 0 20 14" className="w-5 h-4 text-current opacity-70" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="1" y="1" width="10" height="12" rx="1.5" /><rect x="13" y="1" width="6" height="5" rx="1.5" /><rect x="13" y="8" width="6" height="5" rx="1.5" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={cn("text-xs font-semibold", layoutId === l.id ? "text-primary" : "text-foreground")}>
                      {l.label}
                      {layoutId === l.id && <span className="ml-2 text-[10px] opacity-60 font-normal">active</span>}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{l.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* ── Theme ──────────────────────────────────────────── */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5 font-medium">
              Theme · Typography &amp; Radius
            </p>
            <div className="flex flex-col gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border text-left transition-all",
                    theme === t.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  <div className="h-8 w-8 rounded shrink-0 border border-border/60 shadow-sm" style={{ backgroundColor: t.preview }} />
                  <div className="flex flex-col min-w-0">
                    <span className={cn("text-xs font-semibold", theme === t.id ? "text-primary" : "text-foreground")}>
                      {t.label}
                      {theme === t.id && <span className="ml-2 text-[10px] opacity-60 font-normal">active</span>}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{t.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-border" />

          {/* ── Color Scheme ────────────────────────────────────── */}
          <section>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2.5 font-medium">
              Color Scheme · Palette Only
            </p>
            <div className="flex flex-col gap-1.5">
              {COLOR_SCHEMES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setColorScheme(s.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-md border text-left transition-all",
                    colorScheme === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:border-primary/40"
                  )}
                >
                  {s.preview ? (
                    <div
                      className="h-8 w-8 rounded shrink-0 border border-border/60 shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: s.preview }}
                    >
                      {colorScheme === s.id && <Check className="h-4 w-4 text-white drop-shadow" />}
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded shrink-0 border border-border/60 shadow-sm bg-gradient-to-br from-primary/30 to-muted flex items-center justify-center">
                      {colorScheme === s.id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className={cn("text-xs font-semibold", colorScheme === s.id ? "text-primary" : "text-foreground")}>
                      {s.label}
                      {colorScheme === s.id && <span className="ml-2 text-[10px] opacity-60 font-normal">active</span>}
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{s.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

        </div>
      </PopoverContent>
    </Popover>
  );
}
