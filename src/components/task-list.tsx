import React from "react";
import { useListTasks } from "@workspace/api-client-react";
import { TaskItem } from "./task-item";
import { Skeleton } from "@/components/ui/skeleton";
import { Terminal } from "lucide-react";

export function TaskList({ filter }: { filter: "all" | "pending" | "completed" }) {
  const { data: tasks, isLoading, isError } = useListTasks({ status: filter }, { query: { queryKey: ['/api/tasks', { status: filter }] } });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
      </div>
    );
  }

  if (isError || !tasks) {
    return (
      <div className="flex items-center justify-center p-8 border border-border border-dashed rounded-md bg-muted/20">
        <span className="font-mono text-sm text-destructive">ERR_FETCHING_TASKS</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-border border-dashed rounded-md bg-muted/20 text-center">
        <Terminal className="h-8 w-8 text-muted-foreground mb-4 opacity-50" />
        <span className="font-mono text-sm text-muted-foreground">NO_TASKS_FOUND</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
