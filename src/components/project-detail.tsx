import React, { useState, useEffect } from "react";
import {
  useListTasks,
  useUpdateProject,
  useDeleteProject,
  useCompleteTask,
  useCreateTask,
  getListProjectsQueryKey,
  getListTasksQueryKey,
  getGetDailyBriefingQueryKey,
  getGetTaskStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Pencil,
  Check,
  Trash2,
  Archive,
  CalendarClock,
  AlertTriangle,
  Plus,
  Loader2,
  Circle,
  CheckCircle2,
} from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

const STATUS_OPTIONS = [
  { value: "planned", label: "Planned", color: "text-muted-foreground", bg: "bg-muted/50 border-border" },
  { value: "active", label: "Active", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
  { value: "blocked", label: "Blocked", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  { value: "completed", label: "Completed", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { value: "archived", label: "Archived", color: "text-muted-foreground/60", bg: "bg-muted/30 border-border/50" },
] as const;

type ProjectStatus = "planned" | "active" | "blocked" | "completed" | "archived";

interface Project {
  id: number;
  name: string;
  description?: string | null;
  color: string;
  status: string;
  dueDate?: string | null;
  isOverdue?: boolean;
  taskCount: number;
  completedCount: number;
  completionPercentage: number;
}

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
}

export function ProjectDetail({ project, onClose, onDeleted }: ProjectDetailProps) {
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const friendly = theme !== "terminal";

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project.status as ProjectStatus);
  const [color, setColor] = useState(project.color);
  const [dueDate, setDueDate] = useState(project.dueDate ?? "");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const completeTask = useCompleteTask();
  const createTask = useCreateTask();

  const { data: tasks = [], isLoading: tasksLoading } = useListTasks(
    { projectId: project.id, status: "all" },
    { query: { queryKey: ["/api/tasks", { projectId: project.id }] } },
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDailyBriefingQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
  };

  const save = (patch: Record<string, unknown>) => {
    updateProject.mutate({ id: project.id, data: patch as any }, { onSuccess: invalidate });
  };

  const commitName = () => {
    setEditingName(false);
    if (name.trim() && name.trim() !== project.name) {
      save({ name: name.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    const val = description.trim() || null;
    if (val !== (project.description ?? null)) {
      save({ description: val });
    }
  };

  const handleStatusChange = (s: ProjectStatus) => {
    setStatus(s);
    save({ status: s });
  };

  const handleColorChange = (c: string) => {
    setColor(c);
    save({ color: c });
  };

  const handleDueDateChange = (d: string) => {
    setDueDate(d);
    save({ dueDate: d || null });
  };

  const handleToggleTask = (taskId: number, completed: boolean) => {
    completeTask.mutate(
      { id: taskId, data: { completed: !completed } },
      { onSuccess: invalidate },
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || createTask.isPending) return;
    createTask.mutate(
      { data: { title: newTaskTitle.trim(), projectId: project.id } },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          invalidate();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    deleteProject.mutate({ id: project.id }, { onSuccess: () => { invalidate(); onDeleted(); } });
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const completionPct = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const today = new Date().toISOString().split("T")[0];
  const isOverdue = dueDate && dueDate < today && status !== "completed" && status !== "archived";

  const currentStatusMeta = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "relative z-10 flex flex-col w-full max-w-md bg-card border-l border-border shadow-2xl overflow-hidden animate-in slide-in-from-right-8 duration-200",
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-border shrink-0">
          {/* Color picker */}
          <div className="relative mt-1 shrink-0 group">
            <div
              className="h-5 w-5 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-card ring-transparent group-hover:ring-primary/40 transition-all"
              style={{ backgroundColor: color }}
            />
            <div className="absolute top-7 left-0 z-20 hidden group-hover:flex gap-1 p-2 rounded-xl border border-border bg-card shadow-lg">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    "h-5 w-5 rounded-full transition-all border-2",
                    color === c ? "border-foreground scale-110" : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitName(); if (e.key === "Escape") { setName(project.name); setEditingName(false); } }}
                  onBlur={commitName}
                  className="flex-1 text-lg font-semibold bg-transparent border-b-2 border-primary outline-none text-foreground"
                />
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="group/name flex items-center gap-2 text-left"
              >
                <h2 className="text-lg font-semibold text-foreground truncate">{name}</h2>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
              </button>
            )}

            {/* Status badge */}
            <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1", currentStatusMeta.bg, currentStatusMeta.color)}>
              {currentStatusMeta.label}
            </span>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Status selector */}
          <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value as ProjectStatus)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                    status === s.value ? cn(s.bg, s.color, "font-semibold") : "bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          {/* Due date */}
          <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Due Date</p>
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-2 flex-1", isOverdue && "text-destructive")}>
                <CalendarClock className="h-4 w-4 shrink-0" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => handleDueDateChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none border-b border-border focus:border-primary text-foreground"
                />
              </div>
              {isOverdue && (
                <span className="flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> Overdue
                </span>
              )}
              {dueDate && (
                <button
                  onClick={() => handleDueDateChange("")}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Description */}
          <section>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add a description…"
              rows={3}
              className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </section>

          {/* Progress */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</p>
              <span className="text-xs font-semibold text-foreground">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-1">
              {completedTasks.length} of {tasks.length} task{tasks.length === 1 ? "" : "s"} complete
            </p>
          </section>

          {/* Tasks */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tasks</p>

            {/* Add task */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task…"
                className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim() || createTask.isPending}
                className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
              >
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </form>

            {tasksLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-9 rounded-xl bg-muted/40 animate-pulse" />)}
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No tasks yet — add one above.
              </p>
            ) : (
              <div className="flex flex-col gap-1">
                {pendingTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task.id, task.completed)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted/60 text-left transition-colors group"
                  >
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                    {task.priority === "high" && (
                      <span className="text-[10px] text-destructive/80 shrink-0">HIGH</span>
                    )}
                  </button>
                ))}
                {completedTasks.length > 0 && (
                  <>
                    <p className="text-[11px] text-muted-foreground px-2 pt-2 pb-1">Completed</p>
                    {completedTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => handleToggleTask(task.id, task.completed)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted/60 text-left transition-colors"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm text-muted-foreground line-through flex-1 truncate">{task.title}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-4 border-t border-border">
          <button
            onClick={() => handleStatusChange("archived")}
            disabled={status === "archived"}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Archive className="h-3.5 w-3.5" />
            Archive
          </button>

          <button
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all",
              confirmDelete
                ? "text-destructive bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 font-medium"
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            )}
          >
            {deleteProject.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {confirmDelete ? "Confirm delete" : "Delete project"}
          </button>
        </div>
      </div>
    </div>
  );
}
