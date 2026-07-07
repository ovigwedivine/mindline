import React from "react";
import type { DayPlan } from "@workspace/api-client-react";
import { useTheme } from "@/lib/theme";
import { Terminal, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScheduleView({ plan }: { plan: DayPlan }) {
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  if (!plan) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary card */}
      <div className={cn("border p-4", technical ? "bg-primary/10 border-primary/30 rounded-md" : "bg-primary/5 border-primary/20 rounded-2xl shadow-sm")}>
        <div className={cn("flex items-center gap-2 mb-2 text-primary", technical ? "font-mono text-sm tracking-wider uppercase" : "font-sans font-semibold text-sm")}>
          {technical ? <Sparkles className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {technical ? "AI_SUMMARY" : "AI Summary"}
        </div>
        <p className={cn("text-sm leading-relaxed", technical ? "text-primary/90 font-sans" : "text-foreground/80 font-sans")}>
          {plan.summary}
        </p>
      </div>

      {/* Timeline */}
      <div className="flex flex-col relative before:content-[''] before:absolute before:inset-y-0 before:left-[4.5rem] before:w-px before:bg-border">
        {plan.scheduledTasks.map((slot, i) => (
          <div key={i} className="flex items-stretch gap-6 relative group">
            <div className="absolute left-[4.5rem] top-4 w-2 h-2 rounded-full bg-border -translate-x-[3.5px] group-hover:bg-primary transition-colors z-10 shadow-[0_0_0_4px_hsl(var(--background))]" />
            <div className="w-16 py-3 text-right shrink-0">
              <span className={cn("text-xs text-muted-foreground tracking-wider block", technical && "font-mono")}>
                {slot.startTime}
              </span>
              <span className={cn("text-[10px] text-muted-foreground/50 tracking-wider block mt-0.5", technical && "font-mono")}>
                {slot.endTime}
              </span>
            </div>
            <div className="flex-1 py-2 min-w-0">
              <div className={cn("bg-card border border-border p-4 group-hover:border-primary/50 transition-colors", technical ? "rounded-md" : "rounded-2xl shadow-sm")}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <h4 className={cn("font-medium text-sm leading-snug min-w-0", technical ? "font-sans tracking-wide" : "font-sans")}>
                    {slot.task.title}
                  </h4>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 border shrink-0",
                    technical ? "font-mono rounded uppercase tracking-wider" : "font-sans rounded-full",
                    slot.task.priority === "high" ? "text-destructive border-destructive/30 bg-destructive/10" :
                    slot.task.priority === "medium" ? "text-primary border-primary/30 bg-primary/10" :
                    "text-muted-foreground border-border bg-muted",
                  )}>
                    {technical ? slot.task.priority.toUpperCase() : slot.task.priority.charAt(0).toUpperCase() + slot.task.priority.slice(1)}
                  </span>
                </div>
                <div className={cn(
                  "border border-border/50 p-2 text-xs text-muted-foreground leading-relaxed",
                  technical ? "bg-muted/30 rounded font-mono" : "bg-muted/20 rounded-xl font-sans",
                )}>
                  {technical && <span className="text-primary/70 mr-2">&gt;</span>}
                  {slot.reason}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {plan.unscheduledTasks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <div className={cn("flex items-center gap-2 mb-4 text-muted-foreground text-xs", technical ? "font-mono uppercase tracking-wider" : "font-sans font-medium")}>
            {technical && <Terminal className="h-3 w-3" />}
            {technical ? "UNSCHEDULED_TASKS" : "Unscheduled Tasks"}
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.unscheduledTasks.map((task) => (
              <span key={task.id} className={cn("text-xs px-2 py-1 bg-muted border border-border opacity-70", technical ? "font-mono rounded" : "font-sans rounded-xl")}>
                {task.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
