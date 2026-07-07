import React from "react";
import { useGetProductivityStats, getGetProductivityStatsQueryKey } from "@workspace/api-client-react";
import { useTheme } from "@/lib/theme";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, TrendingUp, Clock, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export function ProductivityPanel() {
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  const { data: stats, isLoading } = useGetProductivityStats({
    query: { queryKey: getGetProductivityStatsQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const noData = !stats || stats.totalCompletions === 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn(
            "text-xs",
            technical ? "font-mono uppercase tracking-widest text-muted-foreground" : "font-sans font-semibold text-foreground",
          )}>
            Productivity Analysis
          </h2>
          <p className={cn("text-sm text-muted-foreground mt-0.5", technical && "font-mono text-xs")}>
            {noData
              ? "Complete tasks to unlock your productivity insights"
              : `Based on ${stats.totalCompletions} completed task${stats.totalCompletions === 1 ? "" : "s"}`}
          </p>
        </div>
        <Brain className="h-5 w-5 text-primary opacity-70" />
      </div>

      {noData ? (
        <EmptyState technical={technical} />
      ) : (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard icon={<Clock className="h-3.5 w-3.5" />} label="Peak Hour" value={formatHour(stats.peakStartHour)} technical={technical} />
            <MetricCard icon={<TrendingUp className="h-3.5 w-3.5" />} label="Avg / Day" value={`${stats.avgDailyCompletions}`} technical={technical} />
            <MetricCard icon={<BarChart2 className="h-3.5 w-3.5" />} label="Total" value={`${stats.totalCompletions}`} technical={technical} />
          </div>

          {/* Hourly heatmap */}
          <div>
            <p className={cn("text-[10px] mb-3", technical ? "font-mono uppercase tracking-widest text-muted-foreground" : "font-sans font-medium text-muted-foreground")}>
              Completions by Hour
            </p>
            <HourlyChart data={stats.completionsByHour} peakStartHour={stats.peakStartHour} />
          </div>

          {/* Most productive hours */}
          {stats.mostProductiveHours.length > 0 && (
            <div>
              <p className={cn("text-[10px] mb-2", technical ? "font-mono uppercase tracking-widest text-muted-foreground" : "font-sans font-medium text-muted-foreground")}>
                Most Productive Hours
              </p>
              <div className="flex flex-wrap gap-2">
                {stats.mostProductiveHours.map((h, i) => (
                  <span
                    key={h}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded border",
                      technical && "font-mono",
                      i === 0 ? "text-primary border-primary/40 bg-primary/10" : "text-muted-foreground border-border bg-muted/30",
                    )}
                  >
                    {i === 0 && "★ "}{formatHour(h)}
                  </span>
                ))}
              </div>
              <p className={cn("text-[11px] text-muted-foreground mt-2", technical && "font-mono")}>
                Scheduling adjusted — "Plan My Day" starts at{" "}
                <span className="text-primary">{formatHour(stats.peakStartHour)}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, technical }: { icon: React.ReactNode; label: string; value: string; technical: boolean }) {
  return (
    <div className="bg-background/50 border border-border/50 rounded-md p-3 flex flex-col gap-1.5">
      <div className={cn("flex items-center gap-1.5 text-muted-foreground text-[10px]", technical ? "font-mono uppercase tracking-wider" : "font-sans font-medium")}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("text-lg font-bold tracking-tight", technical && "font-mono")}>{value}</div>
    </div>
  );
}

function HourlyChart({ data, peakStartHour }: { data: { hour: number; count: number }[]; peakStartHour: number }) {
  const visible = data.filter((d) => d.hour >= 6 && d.hour <= 22);
  const maxCount = Math.max(...visible.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {visible.map(({ hour, count }) => {
        const heightPct = count > 0 ? Math.max((count / maxCount) * 100, 8) : 4;
        const isPeak = hour === peakStartHour;
        return (
          <div key={hour} className="flex-1 flex flex-col items-center justify-end gap-1 group relative" title={`${formatHour(hour)}: ${count} task${count === 1 ? "" : "s"}`}>
            <div
              className={cn("w-full rounded-sm transition-all", count === 0 ? "bg-border/30" : isPeak ? "bg-primary" : "bg-primary/40 group-hover:bg-primary/60")}
              style={{ height: `${heightPct}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ technical }: { technical: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 border border-dashed border-border rounded-md bg-muted/10 text-center gap-3">
      <BarChart2 className="h-8 w-8 text-muted-foreground/40" />
      <div>
        <p className={cn("text-xs text-muted-foreground", technical ? "font-mono uppercase tracking-wider" : "font-sans font-medium")}>
          {technical ? "No Data Yet" : "No data yet"}
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Complete your first task to start building productivity insights
        </p>
      </div>
    </div>
  );
}
