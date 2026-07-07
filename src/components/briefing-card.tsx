import React, { useState } from "react";
import {
  useGetDailyBriefing,
  getGetDailyBriefingQueryKey,
} from "@workspace/api-client-react";
import { useTheme } from "@/lib/theme";
import {
  Target,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";

function useBriefingCollapsed() {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    try { return localStorage.getItem("briefing-collapsed") === "true"; } catch { return false; }
  });
  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem("briefing-collapsed", String(v)); } catch {}
  };
  return [collapsed, setCollapsed] as const;
}

function StatBadge({ count, label, variant, friendly }: {
  count: number; label: string; variant: "default" | "destructive" | "warning"; friendly: boolean;
}) {
  if (count === 0) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] px-2 py-0.5 border",
      friendly ? "rounded-full font-medium text-xs" : "rounded font-mono uppercase tracking-wider",
      variant === "destructive" && "text-destructive border-destructive/30 bg-destructive/10",
      variant === "warning" && "text-amber-600 border-amber-400/40 bg-amber-400/10",
      variant === "default" && "text-muted-foreground border-border bg-muted/40",
    )}>
      {count} {label}
    </span>
  );
}

function SectionBlock({ icon, label, content, accent, friendly }: {
  icon: React.ReactNode; label: string; content: string;
  accent?: "primary" | "destructive" | "action"; friendly: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col gap-1.5 p-3 border rounded-lg bg-background/50",
      accent === "primary" && "border-primary/20 bg-primary/5",
      accent === "destructive" && "border-destructive/20 bg-destructive/5",
      accent === "action" && "border-primary/30 bg-primary/8",
      friendly && "rounded-xl shadow-sm",
    )}>
      <div className={cn(
        "flex items-center gap-1.5",
        accent === "primary" && "text-primary",
        accent === "destructive" && "text-destructive",
        accent === "action" && "text-primary",
        !accent && "text-muted-foreground",
      )}>
        <span className="shrink-0">{icon}</span>
        <span className={cn("text-[10px]", friendly ? "font-medium text-xs" : "font-mono uppercase tracking-widest")}>
          {label}
        </span>
      </div>
      <p className={cn("text-sm leading-relaxed text-foreground", friendly && "text-[13px]")}>
        {content}
      </p>
    </div>
  );
}

function CompletionSection({ pct, friendly }: { pct: number; friendly: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2 p-3 border rounded-lg bg-background/50 border-border", friendly && "rounded-xl shadow-sm")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <BarChart2 className="h-3.5 w-3.5 shrink-0" />
          <span className={cn("text-[10px]", friendly ? "font-medium text-xs" : "font-mono uppercase tracking-widest")}>
            {friendly ? "Today's Progress" : "Est. Completion"}
          </span>
        </div>
        <span className={cn("font-bold tabular-nums", friendly ? "text-2xl text-primary" : "text-lg font-mono text-primary")}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all duration-700 ease-out rounded-full" style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        {pct === 0
          ? friendly ? "Ready to start — your first task awaits! 🚀" : "No tasks completed yet today."
          : pct === 100
          ? friendly ? "Everything done! You crushed it today 🎉" : "All tasks complete. Outstanding work."
          : friendly ? `${100 - pct}% still to go. Keep it up!` : `${100 - pct}% of workload remaining.`}
      </p>
    </div>
  );
}

function BriefingCardSkeleton({ friendly }: { friendly: boolean }) {
  return (
    <div className={cn("border bg-card p-4 flex flex-col gap-3", friendly ? "rounded-3xl shadow-sm" : "rounded-lg")}>
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 rounded bg-muted animate-pulse" />
        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-2 mt-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-16 rounded bg-muted/60 animate-pulse", friendly ? "rounded-xl" : "rounded-md")} />
        ))}
      </div>
    </div>
  );
}

export function BriefingCard() {
  const { styleProfile } = useTheme();
  const friendly = styleProfile === "friendly";
  const [collapsed, setCollapsed] = useBriefingCollapsed();

  const { data, isLoading, isRefetching, refetch } = useGetDailyBriefing({
    query: { queryKey: getGetDailyBriefingQueryKey(), staleTime: 5 * 60 * 1000 },
  });

  if (isLoading) return <BriefingCardSkeleton friendly={friendly} />;
  if (!data) return null;

  const today = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div className={cn("border bg-card overflow-hidden", friendly ? "rounded-3xl shadow-md" : "rounded-lg")}>
      {!friendly && (
        <div className="h-0.5 bg-primary/30 relative">
          <div className="absolute inset-y-0 left-0 bg-primary" style={{ width: `${data.estimatedCompletion}%` }} />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Newspaper className={cn("shrink-0", friendly ? "h-4 w-4 text-primary" : "h-3.5 w-3.5 text-primary")} />
            <span className={cn(friendly ? "font-semibold text-sm text-foreground" : "font-mono text-xs uppercase tracking-widest text-muted-foreground")}>
              {friendly ? "Today's Briefing ✨" : "Daily Briefing"}
            </span>
            <span className={cn("shrink-0", friendly ? "text-xs text-muted-foreground" : "font-mono text-[10px] text-muted-foreground/50")}>
              {friendly ? today : `// ${today}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!collapsed && (
              <div className="hidden sm:flex items-center gap-1.5">
                <StatBadge count={data.stats.overdueCount} label="overdue" variant="destructive" friendly={friendly} />
                <StatBadge count={data.stats.dueTodayCount} label="due today" variant="warning" friendly={friendly} />
                <StatBadge count={data.stats.highPriorityCount} label="high" variant="default" friendly={friendly} />
              </div>
            )}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              title="Refresh briefing"
              className={cn("flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground", friendly ? "h-7 w-7 rounded-full hover:bg-muted" : "h-6 w-6 rounded")}
            >
              <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand" : "Collapse"}
              className={cn("flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground", friendly ? "h-7 w-7 rounded-full hover:bg-muted" : "h-6 w-6 rounded")}
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {!collapsed && (
          <>
            <p className={cn("text-muted-foreground leading-relaxed", friendly ? "text-sm" : "text-xs font-sans")}>
              {data.summary}
            </p>

            {/* Mobile stat badges (hidden on sm+, shown in header on sm+) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:hidden">
              <StatBadge count={data.stats.overdueCount} label="overdue" variant="destructive" friendly={friendly} />
              <StatBadge count={data.stats.dueTodayCount} label="due today" variant="warning" friendly={friendly} />
              <StatBadge count={data.stats.highPriorityCount} label="high priority" variant="default" friendly={friendly} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <SectionBlock icon={<Target className="h-3.5 w-3.5" />} label={friendly ? "Today's Focus" : "Focus"} content={data.todaysFocus} accent="primary" friendly={friendly} />
              <SectionBlock icon={<AlertTriangle className="h-3.5 w-3.5" />} label={friendly ? "Biggest Risk" : "Risk"} content={data.biggestRisk} accent="destructive" friendly={friendly} />
              <SectionBlock icon={<ArrowRight className="h-3.5 w-3.5" />} label={friendly ? "Next Action" : "Action"} content={data.recommendedAction} accent="action" friendly={friendly} />
              <CompletionSection pct={data.estimatedCompletion} friendly={friendly} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
