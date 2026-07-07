import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCreateTask,
  useListProjects,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  priority: z.enum(["high", "medium", "low"]).optional(),
  estimatedMinutes: z.coerce.number().optional().or(z.literal("")),
  deadline: z.string().optional(),
  projectId: z.string().optional(),
});

export function SimpleTaskForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: projects } = useListProjects();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      priority: "medium",
      estimatedMinutes: "",
      deadline: "",
      projectId: "",
    },
  });

  const createTask = useCreateTask({
    mutation: {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Couldn't add task", description: err.message, variant: "destructive" });
      },
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createTask.mutate({
      data: {
        title: values.title,
        priority: values.priority as any,
        estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : undefined,
        deadline: values.deadline || undefined,
        projectId: values.projectId ? Number(values.projectId) : undefined,
      },
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
      {/* Main input */}
      <div className="flex items-center gap-2 rounded-2xl border-2 border-border bg-card px-4 py-2 focus-within:border-primary/60 transition-colors shadow-sm">
        <input
          {...form.register("title")}
          placeholder="What would you like to accomplish? ✨"
          autoComplete="off"
          className="flex-1 text-sm text-foreground placeholder:text-muted-foreground/60 bg-transparent focus:outline-none"
        />
        <button
          type="submit"
          disabled={createTask.isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {createTask.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add
        </button>
      </div>

      {/* Secondary controls row */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <input
          type="date"
          {...form.register("deadline")}
          min={new Date().toISOString().split("T")[0]}
          className="rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          type="number"
          {...form.register("estimatedMinutes")}
          placeholder="Minutes"
          className="w-24 rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/60"
        />
        <select
          {...form.register("priority")}
          className="rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="low">Low priority</option>
          <option value="medium">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        {projects && projects.length > 0 && (
          <select
            {...form.register("projectId")}
            className="rounded-xl border border-border bg-input px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </form>
  );
}
