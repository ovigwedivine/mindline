import React from "react";
import { useListTasks } from "@workspace/api-client-react";
import { SimpleTaskItem } from "./simple-task-item";
import { Sparkles } from "lucide-react";

export function SimpleTaskList({ filter }: { filter: "all" | "pending" | "completed" }) {
  const { data: tasks, isLoading, isError } = useListTasks(
    { status: filter },
    { query: { queryKey: ["/api/tasks", { status: filter }] } }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-muted/30 h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !tasks) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/8 p-6 text-center">
        <p className="text-sm text-destructive">Couldn't load tasks. Please try again.</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 flex flex-col items-center gap-3 text-center">
        <Sparkles className="h-8 w-8 text-primary/40" />
        <p className="text-sm font-medium text-muted-foreground">
          {filter === "completed" ? "Nothing completed yet — you've got this! 💪" : "All clear! Add a task to get started. 🌟"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <SimpleTaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
