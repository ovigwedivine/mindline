import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ScrollFadeProps {
  children: React.ReactNode;
  /** Classes applied to the outer relative wrapper (use for flex sizing: flex-1 min-h-0) */
  className?: string;
  /** Classes applied to the inner overflow-y-auto div */
  scrollClassName?: string;
  /**
   * CSS color used for the gradient. Must match the panel background.
   * Accepts any CSS color or variable, e.g. "hsl(var(--card))" or "hsl(var(--background))".
   * Defaults to "hsl(var(--card))".
   */
  fadeColor?: string;
  /** Height of the bottom fade in px. Default 64. */
  fadeHeight?: number;
}

/**
 * ScrollFade — wraps a scrollable region with:
 *  • A top shadow that appears once the user scrolls down
 *  • A bottom gradient that appears when more content exists below
 * Both indicators transition in/out smoothly and are aria-hidden.
 */
export function ScrollFade({
  children,
  className,
  scrollClassName,
  fadeColor = "hsl(var(--card))",
  fadeHeight = 64,
}: ScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atTop = el.scrollTop < 4;
    const atBottom = el.scrollTop >= el.scrollHeight - el.clientHeight - 4;
    setShowTop(!atTop);
    setShowBottom(!atBottom && el.scrollHeight > el.clientHeight + 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Also observe children size changes
    const mo = new MutationObserver(update);
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, [update]);

  const topGradient = `linear-gradient(to bottom, ${fadeColor} 0%, transparent 100%)`;
  const bottomGradient = `linear-gradient(to top, ${fadeColor} 0%, transparent 100%)`;

  return (
    <div className={cn("relative min-h-0", className)}>
      {/* ── Top shadow — appears once scrolled away from top ─────── */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 z-10 pointer-events-none transition-opacity duration-200",
          showTop ? "opacity-100" : "opacity-0",
        )}
        style={{ height: 32, background: topGradient }}
      />

      {/* ── Scrollable content ───────────────────────────────────── */}
      <div
        ref={scrollRef}
        className={cn("overflow-y-auto h-full", scrollClassName)}
      >
        {children}
      </div>

      {/* ── Bottom fade — appears when more content exists below ──── */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 pointer-events-none transition-opacity duration-200",
          showBottom ? "opacity-100" : "opacity-0",
        )}
        style={{ height: fadeHeight, background: bottomGradient }}
      />
    </div>
  );
}
