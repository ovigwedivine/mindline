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
import { useTheme } from "@/lib/theme";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Clock, Brain, CalendarClock, AlertTriangle, Check, X, FolderOpen, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

function getDeadlineInfo(deadline: string | null | undefined) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline + "T00:00:00");
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) { const abs = Math.abs(diffDays); return { label: abs === 1 ? "1d overdue" : `${abs}d overdue`, isOverdue: true, isUrgent: false }; }
  if (diffDays === 0) return { label: "due today", isOverdue: false, isUrgent: true };
  if (diffDays === 1) return { label: "due tomorrow", isOverdue: false, isUrgent: true };
  if (diffDays <= 3) return { label: `due in ${diffDays}d`, isOverdue: false, isUrgent: true };
  return { label: `due in ${diffDays}d`, isOverdue: false, isUrgent: false };
}

const priorityColorsTechnical = {
  high: "text-destructive border-destructive/30 bg-destructive/10",
  medium: "text-primary border-primary/30 bg-primary/10",
  low: "text-muted-foreground border-border bg-muted",
};
const priorityColorsFriendly = {
  high: "text-destructive bg-destructive/10 border-destructive/20",
  medium: "text-amber-600 bg-amber-400/15 border-amber-400/20",
  low: "text-emerald-600 bg-emerald-500/12 border-emerald-500/20",
};

export function TaskItem({ task }: { task: Task }) {
  const queryClient = useQueryClient();
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<"high" | "medium" | "low">(task.priority as "high" | "medium" | "low");
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
  const updateTask = useUpdateTask({ mutation: { onSuccess: () => { invalidate(); setIsEditing(false); } } });
  const addDep = useAddTaskDependency({ mutation: { onSuccess: invalidate } });
  const removeDep = useRemoveTaskDependency({ mutation: { onSuccess: invalidate } });

  const handleComplete = (checked: boolean) => { completeTask.mutate({ id: task.id, data: { completed: checked } }); };
  const handleDelete = () => deleteTask.mutate({ id: task.id });
  const handleEdit = () => {
    setEditTitle(task.title); setEditPriority(task.priority as any);
    setEditDeadline(task.deadline ?? ""); setEditMinutes(task.estimatedMinutes?.toString() ?? "");
    setEditProjectId(task.projectId ?? null); setIsEditing(true);
  };
  const handleSave = () => {
    if (!editTitle.trim()) return;
    updateTask.mutate({ id: task.id, data: { title: editTitle.trim(), priority: editPriority, deadline: editDeadline || undefined, estimatedMinutes: editMinutes ? Number(editMinutes) : undefined, projectId: editProjectId } });
  };
  const handleCancel = () => setIsEditing(false);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); };

  const deadlineInfo = task.completed ? null : getDeadlineInfo(task.deadline);
  const blockingTasks = task.blockingTasks ?? [];
  const isBlocked = blockingTasks.length > 0 && !task.completed;
  const availableForDep = (allPendingTasks ?? []).filter((t) => t.id !== task.id && !blockingTasks.find((bt) => bt.id === t.id));

  const priorityColors = technical ? priorityColorsTechnical : priorityColorsFriendly;
  const inputCls = cn("border-border focus-visible:ring-primary bg-background", technical ? "font-mono text-xs" : "font-sans text-sm");

  if (isEditing) {
    return (
      <div className={cn("flex flex-col gap-2 p-3 border border-primary/50 bg-card ring-1 ring-primary/20", technical ? "rounded-md" : "rounded-2xl shadow-md")}>
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className={cn("h-8 border-border focus-visible:ring-primary bg-background", technical ? "font-mono text-sm" : "font-sans text-sm")}
          placeholder="Task title"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={editDeadline}
            onChange={(e) => setEditDeadline(e.target.value)}
            className={cn("h-7 w-36", inputCls)}
          />
          <Input
            type="number"
            value={editMinutes}
            onChange={(e) => setEditMinutes(e.target.value)}
            placeholder={technical ? "MINS" : "mins"}
            className={cn("h-7 w-20", inputCls, technical && "uppercase")}
          />
          <Select value={editPriority} onValueChange={(v) => setEditPriority(v as any)}>
            <SelectTrigger className={cn("h-7 w-24 border-border focus:ring-primary bg-background", technical ? "font-mono text-xs uppercase" : "font-sans text-xs")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{technical ? "LOW" : "Low"}</SelectItem>
              <SelectItem value="medium">{technical ? "MED" : "Medium"}</SelectItem>
              <SelectItem value="high">{technical ? "HIGH" : "High"}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={editProjectId?.toString() ?? "none"}
            onValueChange={(v) => setEditProjectId(v === "none" ? null : Number(v))}
          >
            <SelectTrigger className={cn("h-7 w-32 border-border focus:ring-primary bg-background", technical ? "font-mono text-xs" : "font-sans text-xs")}>
              <SelectValue placeholder={technical ? "PROJECT" : "Project"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {(projects ?? []).map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 ml-auto">
            <Button size="sm" variant="ghost" onClick={handleCancel} className={cn("h-7 px-2 text-muted-foreground hover:text-foreground", technical ? "font-mono text-xs" : "font-sans text-xs")}>
              <X className="h-3.5 w-3.5 mr-1" />{technical ? "CANCEL" : "Cancel"}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!editTitle.trim() || updateTask.isPending} className={cn("h-7 px-2 bg-primary text-primary-foreground hover:bg-primary/90", technical ? "font-mono text-xs" : "font-sans text-xs")}>
              <Check className="h-3.5 w-3.5 mr-1" />{technical ? "SAVE" : "Save"}
            </Button>
          </div>
        </div>

        {/* Dependencies */}
        <div className="border-t border-border/50 pt-2 mt-1">
          <p className={cn("text-muted-foreground mb-1.5 flex items-center gap-1", technical ? "text-[10px] font-mono uppercase tracking-wider" : "text-xs font-medium")}>
            <Link2 className="inline h-3 w-3 mr-1" />Blocked by
          </p>
          <div className="flex flex-wrap gap-1 mb-2">
            {blockingTasks.map((bt) => (
              <span key={bt.id} className={cn("flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-500", technical ? "text-[10px] font-mono rounded" : "text-[10px] font-sans rounded-full")}>
                {bt.title.length > 20 ? bt.title.slice(0, 20) + "…" : bt.title}
                <button onClick={() => removeDep.mutate({ id: task.id, dependsOnId: bt.id })} disabled={removeDep.isPending} className="hover:text-destructive ml-0.5">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
            {blockingTasks.length === 0 && <span className={cn("text-muted-foreground/50", technical ? "text-[10px] font-mono" : "text-[10px] font-sans")}>none</span>}
          </div>
          {availableForDep.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => { if (!e.target.value) return; addDep.mutate({ id: task.id, data: { dependsOnTaskId: Number(e.target.value) } }); e.target.value = ""; }}
              className={cn("h-7 rounded border border-border bg-background text-muted-foreground px-2 focus:outline-none focus:ring-1 focus:ring-primary/50", technical ? "font-mono text-[10px]" : "font-sans text-xs")}
            >
              <option value="">+ add blocking task…</option>
              {availableForDep.map((t) => <option key={t.id} value={t.id}>{t.title.length > 40 ? t.title.slice(0, 40) + "…" : t.title}</option>)}
            </select>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "group flex items-center justify-between p-3 border border-border bg-card hover:border-primary/50 transition-colors relative overflow-hidden",
      technical ? "rounded-md" : "rounded-2xl shadow-sm",
      task.completed && "opacity-60 bg-muted/30",
      isBlocked && !task.completed && "border-amber-500/30 bg-amber-500/5",
      deadlineInfo?.isOverdue && !task.completed && "border-destructive/40 bg-destructive/5",
    )}>
      {deadlineInfo?.isOverdue && !task.completed && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-destructive" />}
      {isBlocked && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />}

      <div className="flex items-center gap-4 z-10 min-w-0 flex-1">
        <Checkbox
          checked={task.completed}
          onCheckedChange={handleComplete}
          disabled={completeTask.isPending}
          className="h-5 w-5 shrink-0 border-muted-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <button
            onClick={handleEdit}
            disabled={task.completed}
            className={cn(
              "font-medium text-sm text-left transition-colors hover:text-primary truncate",
              technical ? "font-sans tracking-wide" : "font-sans",
              task.completed ? "line-through text-muted-foreground cursor-default" : "cursor-text",
            )}
            title={task.completed ? undefined : "Click to edit"}
          >
            {task.title}
          </button>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 border shrink-0",
              technical ? "font-mono rounded uppercase tracking-wider" : "font-sans rounded-full",
              priorityColors[task.priority as keyof typeof priorityColors],
            )}>
              {technical ? task.priority.toUpperCase() : task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>

            {task.projectName && (
              <span className={cn("flex items-center text-[10px] text-primary/70 shrink-0 gap-0.5", technical ? "font-mono" : "font-sans bg-primary/10 px-2 py-0.5 rounded-full")}>
                <FolderOpen className="h-3 w-3" />{task.projectName}
              </span>
            )}

            {isBlocked && (
              <span className={cn("flex items-center text-[10px] text-amber-500 shrink-0 gap-0.5", technical ? "font-mono" : "font-sans")}>
                ⏳ {technical ? `waiting for: ${blockingTasks.map((t) => t.title).join(", ")}` : `Waiting for ${blockingTasks.length} task${blockingTasks.length > 1 ? "s" : ""}`}
              </span>
            )}

            {deadlineInfo && (
              <span className={cn(
                "flex items-center text-[10px] gap-1 shrink-0",
                technical ? "font-mono" : "font-sans",
                deadlineInfo.isOverdue ? "text-destructive font-semibold" : deadlineInfo.isUrgent ? "text-yellow-500" : "text-muted-foreground",
              )}>
                {deadlineInfo.isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarClock className="h-3 w-3" />}
                {technical ? deadlineInfo.label.toUpperCase() : deadlineInfo.label}
              </span>
            )}

            {task.estimatedMinutes && (
              <span className={cn("flex items-center text-[10px] text-muted-foreground shrink-0", technical ? "font-mono" : "font-sans")}>
                <Clock className="h-3 w-3 mr-1" />{task.estimatedMinutes}m
              </span>
            )}

            {task.aiScore != null && (
              <span className={cn("flex items-center text-[10px] text-primary/80 shrink-0", technical ? "font-mono" : "font-sans")}>
                <Brain className="h-3 w-3 mr-1" />{technical ? `SCORE:${task.aiScore}` : `Score: ${task.aiScore}`}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 shrink-0 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={deleteTask.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
