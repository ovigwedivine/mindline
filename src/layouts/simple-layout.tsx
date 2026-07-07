import React from "react";
import { SimpleTaskList } from "@/components/simple-task-list";
import { BriefingCard } from "@/components/briefing-card";
import { SimpleTaskForm } from "@/components/simple-task-form";
import { ScheduleView } from "@/components/schedule-view";
import { ProductivityPanel } from "@/components/productivity-panel";
import { ProjectsPanel } from "@/components/projects-panel";
import { InboxPanel } from "@/components/inbox-panel";
import { RemindersPanel } from "@/components/reminders-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { InboxTabBadge } from "@/components/inbox-tab-badge";
import { ReminderTabBadge } from "@/components/reminder-tab-badge";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { useGetTaskStats } from "@workspace/api-client-react";
import { BrainCircuit, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/hooks/use-dashboard-data";

function useGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

function SimpleStatCard({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1 shadow-sm border border-border bg-card">
      <span className="text-xl">{emoji}</span>
      <div className="text-2xl font-bold text-foreground leading-none mt-1">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground/70">{sub}</div>}
    </div>
  );
}

function SimpleStatsBar() {
  const { data: stats, isLoading } = useGetTaskStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl h-24 bg-card animate-pulse border border-border" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <SimpleStatCard
        emoji="✅"
        label="Done today"
        value={`${stats.todayCompleted ?? 0}`}
        sub={`of ${stats.todayTotal ?? 0} tasks`}
      />
      <SimpleStatCard
        emoji="📈"
        label="Completion rate"
        value={`${stats.completionRate.toFixed(0)}%`}
      />
      <SimpleStatCard
        emoji="🔥"
        label="Day streak"
        value={`${stats.streak}`}
        sub={stats.streak === 1 ? "day" : "days"}
      />
      <SimpleStatCard
        emoji="🎯"
        label="High priority"
        value={`${stats.highPriority}`}
        sub="pending"
      />
    </div>
  );
}

export function SimpleLayout({ data }: { data: DashboardData }) {
  const { activeTab, setActiveTab, taskFilter, setTaskFilter, dayPlan, handlePlanDay, isPlanningDay } = data;
  const greeting = useGreeting();

  const filterOptions: { id: typeof taskFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "To Do" },
    { id: "completed", label: "Done ✓" },
  ];

  const sidebarTabs = [
    { id: "inbox" as const, label: "Inbox", emoji: "📥", disabled: false },
    { id: "projects" as const, label: "Projects", emoji: "📁", disabled: false },
    { id: "reminders" as const, label: "Reminders", emoji: "🔔", disabled: false },
    { id: "schedule" as const, label: "Schedule", emoji: "📅", disabled: !dayPlan },
    { id: "productivity" as const, label: "Insights", emoji: "✨", disabled: false },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex flex-col gap-5 lg:h-screen lg:overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {greeting.text} {greeting.emoji}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <WorkspaceSwitcher />
            <button
              onClick={handlePlanDay}
              disabled={isPlanningDay}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
            >
              {isPlanningDay ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="h-4 w-4" />
              )}
              <span className="hidden xs:inline">Plan my day</span>
              <span className="xs:hidden">Plan</span>
            </button>
            <SettingsPanel />
          </div>
        </header>

        {/* ── Stats row ──────────────────────────────────────────── */}
        <div className="shrink-0">
          <SimpleStatsBar />
        </div>

        {/* ── Daily Briefing ─────────────────────────────────────── */}
        <div className="shrink-0">
          <BriefingCard />
        </div>

        {/* ── Two-column body ────────────────────────────────────── */}
        <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">

          {/* Left — task management */}
          <div className="flex flex-col gap-4 lg:min-h-0 rounded-3xl bg-card border border-border shadow-sm p-5 lg:overflow-hidden">
            <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
              <h2 className="font-semibold text-sm text-foreground flex items-center gap-2">
                📝 My Tasks
              </h2>
              <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
                {filterOptions.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTaskFilter(f.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      taskFilter === f.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="shrink-0">
              <SimpleTaskForm />
            </div>

            <ScrollFade
              className="lg:flex-1 lg:min-h-0"
              scrollClassName="pb-2 pr-1 scrollbar-thin"
              fadeColor="hsl(var(--card))"
            >
              <SimpleTaskList filter={taskFilter} />
            </ScrollFade>
          </div>

          {/* Right — sidebar */}
          <div className="flex flex-col gap-3 lg:min-h-0">
            <div className="flex gap-2 shrink-0 overflow-x-auto scrollbar-none pb-0.5">
              {sidebarTabs.map((tab) => (
                <button
                  key={tab.id}
                  disabled={tab.disabled}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-medium transition-all border shadow-sm whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/30",
                    tab.disabled && "opacity-30 cursor-not-allowed pointer-events-none",
                  )}
                >
                  <span>{tab.emoji}</span>
                  {tab.label}
                  {tab.id === "inbox" && <InboxTabBadge className="ml-0.5" />}
                  {tab.id === "reminders" && <ReminderTabBadge className="ml-0.5" />}
                </button>
              ))}
            </div>

            {/* Sidebar panel with scroll fade */}
            <div className="min-h-[300px] lg:flex-1 lg:min-h-0 relative rounded-3xl bg-card border border-border shadow-sm overflow-hidden">
              <ScrollFade
                className="absolute inset-0"
                scrollClassName="p-5 scrollbar-thin"
                fadeColor="hsl(var(--card))"
              >
                {activeTab === "inbox" && <InboxPanel />}

                {activeTab === "projects" && <ProjectsPanel />}

                {activeTab === "reminders" && <RemindersPanel />}

                {activeTab === "schedule" && dayPlan && <ScheduleView plan={dayPlan} />}

                {activeTab === "schedule" && !dayPlan && (
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-4 text-center">
                    <span className="text-4xl">🗓️</span>
                    <div>
                      <p className="font-semibold text-foreground">No schedule yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Let AI plan your day based on your tasks and productivity patterns.
                      </p>
                    </div>
                    <button
                      onClick={handlePlanDay}
                      disabled={isPlanningDay}
                      className="flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {isPlanningDay ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <BrainCircuit className="h-4 w-4" />
                      )}
                      Plan my day
                    </button>
                  </div>
                )}

                {activeTab === "productivity" && <ProductivityPanel />}

                {activeTab === "tasks" && (
                  <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
                    <span className="text-4xl">✨</span>
                    <p className="text-sm text-muted-foreground">
                      Pick a view above to see your projects, schedule or productivity insights.
                    </p>
                  </div>
                )}
              </ScrollFade>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
