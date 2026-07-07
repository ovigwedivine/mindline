import React from "react";
import { TaskList } from "@/components/task-list";
import { BriefingCard } from "@/components/briefing-card";
import { ScheduleView } from "@/components/schedule-view";
import { TaskForm } from "@/components/task-form";
import { ProductivityPanel } from "@/components/productivity-panel";
import { ProjectsPanel } from "@/components/projects-panel";
import { InboxPanel } from "@/components/inbox-panel";
import { RemindersPanel } from "@/components/reminders-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { InboxTabBadge } from "@/components/inbox-tab-badge";
import { ReminderTabBadge } from "@/components/reminder-tab-badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, ListTodo, CalendarDays, BarChart2, FolderOpen, Inbox as InboxIcon, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/hooks/use-dashboard-data";

export function FocusLayout({ data }: { data: DashboardData }) {
  const { activeTab, setActiveTab, taskFilter, setTaskFilter, dayPlan, handlePlanDay, isPlanningDay } = data;

  const tabs = [
    { id: "inbox" as const, label: "Inbox", icon: InboxIcon },
    { id: "tasks" as const, label: "Tasks", icon: ListTodo },
    { id: "schedule" as const, label: "Schedule", icon: CalendarDays, disabled: !dayPlan },
    { id: "projects" as const, label: "Projects", icon: FolderOpen },
    { id: "reminders" as const, label: "Reminders", icon: Bell },
    { id: "productivity" as const, label: "Insights", icon: BarChart2 },
  ];

  return (
    // Outer: page scrolls — min-h-screen, no fixed height
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 pt-6 pb-8">
      {/* Content column: natural height — no height: calc(...) */}
      <div className="w-full max-w-2xl flex flex-col gap-0">

        {/* Minimal header */}
        <header className="flex items-center justify-between mb-8 flex-wrap gap-2">
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground">Mindline</span>
            <span className="ml-3 text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <WorkspaceSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlanDay}
              disabled={isPlanningDay}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              {isPlanningDay ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <BrainCircuit className="h-3.5 w-3.5" />
              )}
              Plan
            </Button>
            <SettingsPanel />
          </div>
        </header>

        {/* Daily Briefing — natural height */}
        <BriefingCard />

        {/* Tab navigation */}
        <div className="flex items-center gap-1 my-6 overflow-x-auto scrollbar-none flex-nowrap">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all shrink-0",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  tab.disabled && "opacity-30 cursor-not-allowed pointer-events-none"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.id === "inbox" && <InboxTabBadge className="ml-1" />}
                {tab.id === "reminders" && <ReminderTabBadge className="ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Content area — natural height, page scrolls */}
        <div className="flex flex-col gap-5">
          {activeTab === "inbox" && <InboxPanel />}

          {activeTab === "tasks" && (
            <>
              <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
                <TaskForm />
              </div>

              {/* Filter strip */}
              <div className="flex items-center gap-2">
                {(["all", "pending", "completed"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-md transition-colors capitalize",
                      taskFilter === f
                        ? "text-foreground bg-muted font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Task list — flows at natural height, page scrolls (no inner scroll) */}
              <TaskList filter={taskFilter} />
            </>
          )}

          {/* Schedule — flows at natural height, page scrolls */}
          {activeTab === "schedule" && dayPlan && (
            <ScheduleView plan={dayPlan} />
          )}

          {/* Projects */}
          {activeTab === "projects" && (
            <ProjectsPanel />
          )}

          {/* Reminders */}
          {activeTab === "reminders" && (
            <RemindersPanel />
          )}

          {/* Insights */}
          {activeTab === "productivity" && (
            <ProductivityPanel />
          )}
        </div>

      </div>
    </div>
  );
}
