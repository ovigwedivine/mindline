import React from "react";
import { StatsBar } from "@/components/stats-bar";
import { BriefingCard } from "@/components/briefing-card";
import { TaskList } from "@/components/task-list";
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
import {
  BrainCircuit,
  ListTodo,
  Calendar as CalendarIcon,
  Loader2,
  BarChart2,
  FolderOpen,
  Inbox as InboxIcon,
  Bell,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DashboardData } from "@/hooks/use-dashboard-data";

export function DetailedLayout({ data }: { data: DashboardData }) {
  const { activeTab, setActiveTab, taskFilter, setTaskFilter, dayPlan, handlePlanDay, isPlanningDay } = data;

  return (
    // Outer: page scrolls — no height constraint
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground flex justify-center p-4 sm:p-6 lg:p-8">
      {/* Card: grows with content, overflow-hidden only for rounded-corner clipping */}
      <main className="w-full max-w-4xl bg-card border border-border rounded-lg shadow-2xl flex flex-col relative overflow-hidden">

        {/* Accent bar */}
        <div className="h-1 w-full bg-primary/20 absolute top-0 left-0">
          <div className="h-full bg-primary animate-pulse w-1/3" />
        </div>

        {/* Inner: natural flow — no overflow-hidden, no fixed height */}
        <div className="p-6 sm:p-8 pt-7 flex flex-col gap-6">

          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4 border-b border-border">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mindline</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <WorkspaceSwitcher />
              <Button
                onClick={handlePlanDay}
                disabled={isPlanningDay}
                className="flex-1 md:flex-none"
              >
                {isPlanningDay ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BrainCircuit className="mr-2 h-4 w-4" />
                )}
                Plan My Day
              </Button>
              <SettingsPanel />
            </div>
          </header>

          <StatsBar />

          <BriefingCard />

          {/* Tabs: natural height, no flex-1 min-h-0 */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as any)}
            className="flex flex-col"
          >
            <TabsList className="w-auto max-w-full mb-4 overflow-x-auto scrollbar-none flex-nowrap">
              <TabsTrigger value="inbox" className="shrink-0">
                <InboxIcon className="h-3.5 w-3.5 mr-2" /> Inbox
                <InboxTabBadge className="ml-2" />
              </TabsTrigger>
              <TabsTrigger value="tasks" className="shrink-0">
                <ListTodo className="h-3.5 w-3.5 mr-2" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="schedule" disabled={!dayPlan} className="shrink-0">
                <CalendarIcon className="h-3.5 w-3.5 mr-2" /> Schedule
              </TabsTrigger>
              <TabsTrigger value="projects" className="shrink-0">
                <FolderOpen className="h-3.5 w-3.5 mr-2" /> Projects
              </TabsTrigger>
              <TabsTrigger value="reminders" className="shrink-0">
                <Bell className="h-3.5 w-3.5 mr-2" /> Reminders
                <ReminderTabBadge className="ml-2" />
              </TabsTrigger>
              <TabsTrigger value="productivity" className="shrink-0">
                <BarChart2 className="h-3.5 w-3.5 mr-2" /> Insights
              </TabsTrigger>
            </TabsList>

            {/* Inbox tab */}
            <TabsContent
              value="inbox"
              className="m-0 border-none p-0 outline-none"
            >
              <InboxPanel />
            </TabsContent>

            {/* Tasks tab */}
            <TabsContent
              value="tasks"
              className="flex flex-col gap-4 m-0 border-none p-0 outline-none data-[state=active]:flex"
            >
              <TaskForm />

              {/* Filter bar */}
              <div className="flex items-center gap-2 shrink-0">
                {(["all", "pending", "completed"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={taskFilter === status ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTaskFilter(status)}
                    className="text-xs h-7 px-3 capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>

              {/* Task list — flows at natural height, page scrolls (no inner scroll) */}
              <TaskList filter={taskFilter} />
            </TabsContent>

            {/* Schedule tab — flows at natural height, page scrolls */}
            <TabsContent
              value="schedule"
              className="m-0 border-none p-0 outline-none"
            >
              {dayPlan ? <ScheduleView plan={dayPlan} /> : null}
            </TabsContent>

            {/* Projects tab */}
            <TabsContent
              value="projects"
              className="m-0 border-none p-0 outline-none"
            >
              <ProjectsPanel />
            </TabsContent>

            {/* Reminders tab */}
            <TabsContent
              value="reminders"
              className="m-0 border-none p-0 outline-none"
            >
              <RemindersPanel />
            </TabsContent>

            {/* Insights tab */}
            <TabsContent
              value="productivity"
              className="m-0 border-none p-0 outline-none"
            >
              <ProductivityPanel />
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </div>
  );
}
