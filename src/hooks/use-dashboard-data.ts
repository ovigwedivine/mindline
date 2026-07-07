import { useState } from "react";
import {
  usePlanDay,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
} from "@workspace/api-client-react";
import type { DayPlan } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export type TabId = "tasks" | "schedule" | "productivity" | "projects" | "inbox" | "reminders";
export type FilterId = "all" | "pending" | "completed";

export interface DashboardData {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  taskFilter: FilterId;
  setTaskFilter: (filter: FilterId) => void;
  dayPlan: DayPlan | null;
  handlePlanDay: () => void;
  isPlanningDay: boolean;
}

export function useDashboardData(): DashboardData {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("tasks");
  const [taskFilter, setTaskFilter] = useState<FilterId>("all");
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);

  const planDayMutation = usePlanDay({
    mutation: {
      onSuccess: (data) => {
        setDayPlan(data);
        toast({ title: "Schedule generated", description: "Your day has been planned." });
        setActiveTab("schedule");
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Failed to plan day",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  return {
    activeTab,
    setActiveTab,
    taskFilter,
    setTaskFilter,
    dayPlan,
    handlePlanDay: () => planDayMutation.mutate(),
    isPlanningDay: planDayMutation.isPending,
  };
}
