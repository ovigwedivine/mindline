import React, { useState } from "react";
import type { Task } from "@workspace/api-client-react";
import {
  useCompleteTask,
  useDeleteTask,
  useUpdateTask,
  useListTasks,
  useListProjects,
  useAddTaskDependency,
  useRemoveTaskDependency,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2, CalendarDays, Clock, AlertCircle, Check, X, FolderOpen, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getDeadlineInfo(deadline: string | null | undefined) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      label: abs === 1 ? "1 day overdue" : `${abs} days overdue`,
      isOverdue: true,
      isUrgent: false,
    };
  }
  if (diffDays === 0) return { label: "Due today", isOverdue: false, isUrgent: true };
  if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false, isUrgent: true };
  if (diffDays <= 3) return { label: `Due in ${diffDays} days`, isOverdue: false, isUrgent: true };
  return {
    label: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    isOverdue: false,
    isUrgent: false,
  };
}

const priorityConfig = {
  high: { label: "High", pill: "bg-destructive/12 text-destructive" },
  medium: { label: "Medium", pill: "bg-amber-500/15 text-amber-600" },
  low: { label: "Low", pill: "bg-emerald-500/12 text-emerald-600" },
};

export function SimpleTaskItem({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">(
    task.priority as "high" | "medium" | "low",
  );
  const [editDeadline, setEditDeadline] = useState(task.deadline ?? "");
  const [editMinutes, setEditMinutes] = useState(task.estimatedMinutes?.toString() ?? "");
  const [editProjectId, setEditProjectId] = useState<number | null>(task.projectId ?? null);

  const { data: allPendingTasks } = useListTasks({ status: "pending" });
  const { data: projects } = useListProjects();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
  };

  const completeTask = useCompleteTask({ mutation: { onSuccess: invalidate } });
  const deleteTask = useDeleteTask({ mutation: { onSuccess: invalidate } });
  const updateTask = useUpdateTask({
    mutation: {
      onSuccess: () => {
        invalidate();
        setIsEditing(false);
      },
    },
  });
  const addDep = useAddTaskDependency({ mutation: { onSuccess: invalidate } });
  const removeDep = useRemoveTaskDependency({ mutation: { onSuccess: invalidate } });

  const handleComplete = (e: React.ChangeEvent<HTMLInputElement>) => {
    completeTask.mutate({ id: task.id, data: { completed: e.target.checked } });
  };

  const handleSave = () => {
    if (!editTitle.trim()) return;
    updateTask.mutate({
      id: task.id,
      data: {
        title: editTitle.trim(),
        priority: editPriority,
        deadline: editDeadline || undefined,
        estimatedMinutes: editMinutes ? Number(editMinutes) : undefined,
        projectId: editProjectId,
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setIsEditing(false);
  };

  const deadlineInfo = task.completed ? null : getDeadlineInfo(task.deadline);
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] ?? priorityConfig.medium;
  const blockingTasks = task.blockingTasks ?? [];
  const isBlocked = blockingTasks.length > 0 && !task.completed;

  const availableForDep = (allPendingTasks ?? []).filter(
    (t) => t.id !== task.id && !blockingTasks.find((bt) => bt.id === t.id),
  );

  if (isEditing) {
    return (
      <div className="rounded-2xl border-2 border-primary/40 bg-card shadow-md p-4 flex flex-col gap-3">
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Task title"
          className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-foreground bg-input focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            className="rounded-xl border border-border px-3 py-2 text-xs text-foreground bg-input focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="number"
            value={editMinutes}
            onChange={(e) => setEditMinutes(e.target.value)}
            placeholder="Minutes"
            className="w-24 rounded-xl border border-border px-3 py-2 text-xs text-foreground bg-input focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as any)}
            className="rounded-xl border border-border px-3 py-2 text-xs text-foreground bg-input focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Project selector */}
          <select
            value={editProjectId?.toString() ?? ""}
            onChange={(e) => setEditProjectId(e.target.value ? Number(e.target.value) : null)}
            className="rounded-xl border border-border px-3 py-2 text-xs text-foreground bg-input focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">No project</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editTitle.trim() || updateTask.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" /> Save
            </button>
          </div>
        </div>

        {/* Dependencies section */}
        <div className="border-t border-border/50 pt-3">
          <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Link2 className="h-3.5 w-3.5" /> Blocked by
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {blockingTasks.map((bt) => (
              <span
                key={bt.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-[11px] font-medium"
              >
                ⏳ {bt.title.length > 22 ? bt.title.slice(0, 22) + "…" : bt.title}
                <button
                  onClick={() => removeDep.mutate({ id: task.id, dependsOnId: bt.id })}
                  disabled={removeDep.isPending}
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {blockingTasks.length === 0 && (
              <span className="text-[11px] text-muted-foreground/60">No blockers</span>
            )}
          </div>
          {availableForDep.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                addDep.mutate({ id: task.id, data: { dependsOnTaskId: Number(e.target.value) } });
                e.target.value = "";
              }}
              className="w-full rounded-xl border border-border px-3 py-2 text-xs text-foreground bg-input focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">+ Add a blocking task…</option>
              {availableForDep.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title.length > 45 ? t.title.slice(0, 45) + "…" : t.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all p-4 flex items-start gap-3",
        task.completed ? "opacity-55 border-border" : "border-border",
        isBlocked && !task.completed ? "border-amber-500/30 bg-amber-500/5" : "",
        deadlineInfo?.isOverdue && !task.completed ? "border-destructive/25 bg-destructive/5" : "",
      )}
    >
      {/* Custom circular checkbox */}
      <label className="mt-0.5 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleComplete}
          disabled={completeTask.isPending}
          className="sr-only"
        />
        <div
          className={cn(
            "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
            task.completed
              ? "bg-primary border-primary"
              : "border-muted-foreground/40 hover:border-primary/60",
          )}
        >
          {task.completed && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
        </div>
      </label>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <button
          onClick={() => !task.completed && setIsEditing(true)}
          disabled={task.completed}
          className={cn(
            "text-sm font-medium text-left w-full leading-snug transition-colors",
            task.completed
              ? "line-through text-muted-foreground cursor-default"
              : "text-foreground hover:text-primary cursor-text",
          )}
          title={task.completed ? undefined : "Click to edit"}
        >
          {task.title}
        </button>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", priority.pill)}>
            {priority.label}
          </span>

          {task.projectName && (
            <span className="flex items-center gap-1 text-[11px] text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              <FolderOpen className="h-3 w-3" />
              {task.projectName}
            </span>
          )}

          {isBlocked && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
              ⏳ Waiting for: {blockingTasks.map((t) => t.title).join(", ")}
            </span>
          )}

          {deadlineInfo && (
            <span
              className={cn(
                "flex items-center gap-1 text-[11px]",
                deadlineInfo.isOverdue
                  ? "text-destructive font-medium"
                  : deadlineInfo.isUrgent
                    ? "text-amber-600"
                    : "text-muted-foreground",
              )}
            >
              {deadlineInfo.isOverdue ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <CalendarDays className="h-3 w-3" />
              )}
              {deadlineInfo.label}
            </span>
          )}

          {task.estimatedMinutes && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.estimatedMinutes} min
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteTask.mutate({ id: task.id })}
        disabled={deleteTask.isPending}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
