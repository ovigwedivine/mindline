import React from "react";
import { useGetTaskStats } from "@workspace/api-client-react";
import { useTheme } from "@/lib/theme";
import { Activity, CheckSquare, Zap, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatsBar() {
  const { data: stats, isLoading, isError } = useGetTaskStats();
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (isError || !stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<Activity className="h-4 w-4 text-primary" />}
        label="Completion Rate"
        value={`${stats.completionRate.toFixed(0)}%`}
        technical={technical}
      />
      <StatCard
        icon={<CheckSquare className="h-4 w-4 text-primary" />}
        label="Today's Progress"
        value={`${stats.todayCompleted || 0} / ${stats.todayTotal || 0}`}
        technical={technical}
      />
      <StatCard
        icon={<Zap className="h-4 w-4 text-primary" />}
        label="Current Streak"
        value={`${stats.streak} Days`}
        technical={technical}
      />
      <StatCard
        icon={<Target className="h-4 w-4 text-primary" />}
        label="High Priority"
        value={`${stats.highPriority} Pending`}
        technical={technical}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  technical,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  technical: boolean;
}) {
  return (
    <div className="bg-background/50 border border-border/50 rounded-md p-4 flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={cn(
        "flex items-center gap-2 text-muted-foreground text-xs",
        technical ? "font-mono uppercase tracking-wider" : "font-sans font-medium",
      )}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className={cn("text-2xl font-bold tracking-tight", technical ? "font-mono" : "font-sans")}>
        {value}
      </div>
    </div>
  );
}
