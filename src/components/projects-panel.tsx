import React, { useState } from "react";
import {
  useListProjects,
  useCreateProject,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectDetail } from "@/components/project-detail";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  FolderOpen,
  Loader2,
  AlertTriangle,
  CalendarClock,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Archive,
  Layers,
} from "lucide-react";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

type StatusFilter = "all" | "active" | "blocked" | "planned" | "completed" | "archived";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "blocked", label: "Blocked" },
  { id: "planned", label: "Planned" },
  { id: "completed", label: "Done" },
  { id: "archived", label: "Archived" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  planned:   { label: "Planned",   color: "text-muted-foreground",    bg: "bg-muted/50" },
  active:    { label: "Active",    color: "text-blue-500",            bg: "bg-blue-500/10" },
  blocked:   { label: "Blocked",   color: "text-destructive",         bg: "bg-destructive/10" },
  completed: { label: "Completed", color: "text-emerald-500",         bg: "bg-emerald-500/10" },
  archived:  { label: "Archived",  color: "text-muted-foreground/60", bg: "bg-muted/30" },
};

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

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const meta = STATUS_META[project.status] ?? STATUS_META.planned;
  const daysUntilDue = project.dueDate
    ? Math.ceil((new Date(project.dueDate + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all hover:border-primary/30 hover:shadow-sm group",
        project.isOverdue
          ? "border-destructive/30 bg-destructive/5"
          : project.status === "blocked"
          ? "border-destructive/20 bg-destructive/5"
          : "border-border bg-card",
      )}
    >
      <div className="mt-1 h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">{project.name}</span>
          <span className={cn("shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium", meta.bg, meta.color)}>
            {meta.label}
          </span>
          {project.isOverdue && (
            <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-destructive font-medium">
              <AlertTriangle className="h-3 w-3" /> Overdue
            </span>
          )}
        </div>

        {project.description && (
          <p className="text-[11px] text-muted-foreground mb-1.5 truncate">{project.description}</p>
        )}

        <Progress value={project.completionPercentage} className="h-1 mb-1" />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {project.completedCount}/{project.taskCount} tasks · {project.completionPercentage}%
          </span>
          {project.dueDate && (
            <span className={cn(
              "flex items-center gap-0.5 text-[11px]",
              project.isOverdue ? "text-destructive" : daysUntilDue !== null && daysUntilDue <= 3 ? "text-amber-500" : "text-muted-foreground",
            )}>
              <CalendarClock className="h-3 w-3" />
              {project.isOverdue
                ? `${Math.abs(daysUntilDue ?? 0)}d overdue`
                : daysUntilDue === 0 ? "Due today"
                : daysUntilDue === 1 ? "Due tomorrow"
                : `${daysUntilDue}d left`}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 mt-3" />
    </button>
  );
}

function NewProjectForm({ onCreated }: { onCreated: () => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [status, setStatus] = useState<"planned" | "active">("active");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const createProject = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setName(""); setDueDate(""); setDescription(""); setColor(PRESET_COLORS[0]); setStatus("active");
        setOpen(false);
        onCreated();
      },
    },
  });
  const isSubmitting = createProject.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    createProject.mutate({
      data: {
        name: name.trim(),
        color,
        status,
        dueDate: dueDate || undefined,
        description: description.trim() || undefined,
      },
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-muted/30 transition-all text-sm"
      >
        <Plus className="h-4 w-4" /> New project
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-primary/30 bg-card shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name…"
          className="flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none border-b border-border focus:border-primary pb-0.5"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)…"
        rows={2}
        className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {PRESET_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={cn("h-4 w-4 rounded-full transition-all border-2", color === c ? "border-foreground scale-110" : "border-transparent")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 text-xs">
          {(["active", "planned"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={cn("px-2 py-0.5 rounded-full border transition-all capitalize",
                status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >{s}</button>
          ))}
        </div>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          className="text-xs bg-transparent border-b border-border focus:border-primary outline-none text-foreground py-0.5"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)}
          className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
        >Cancel</button>
        <button type="submit" disabled={!name.trim() || isSubmitting}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Create
        </button>
      </div>
    </form>
  );
}

export function ProjectsPanel() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { data: allProjects = [], isLoading } = useListProjects(
    {},
    { query: { queryKey: getListProjectsQueryKey(), staleTime: 30_000 } },
  );

  const filtered = statusFilter === "all"
    ? allProjects
    : allProjects.filter((p) => p.status === statusFilter);

  const activeCount    = allProjects.filter((p) => p.status === "active").length;
  const blockedCount   = allProjects.filter((p) => p.status === "blocked").length;
  const overdueCount   = allProjects.filter((p) => (p as any).isOverdue).length;
  const completedCount = allProjects.filter((p) => p.status === "completed").length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Summary stats */}
        {allProjects.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Layers className="h-3.5 w-3.5" />,     label: "Active",  value: activeCount,    accent: activeCount > 0    ? "text-blue-500"    : "" },
              { icon: <ShieldAlert className="h-3.5 w-3.5" />, label: "Blocked", value: blockedCount,   accent: blockedCount > 0   ? "text-destructive" : "" },
              { icon: <AlertTriangle className="h-3.5 w-3.5"/>,label: "Overdue", value: overdueCount,   accent: overdueCount > 0   ? "text-amber-500"   : "" },
              { icon: <CheckCircle2 className="h-3.5 w-3.5" />,label: "Done",    value: completedCount, accent: completedCount > 0 ? "text-emerald-500" : "" },
            ].map(({ icon, label, value, accent }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 py-2.5 rounded-xl border border-border bg-muted/20">
                <span className={cn(accent || "text-muted-foreground/60")}>{icon}</span>
                <span className={cn("text-base font-bold tabular-nums", accent || "text-foreground")}>{value}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
          {STATUS_FILTERS.map((f) => {
            const count = f.id === "all" ? allProjects.length : allProjects.filter((p) => p.status === f.id).length;
            return (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                  statusFilter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className={cn("text-[10px] px-1 rounded-full",
                    statusFilter === f.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* New project form */}
        <NewProjectForm onCreated={() => setStatusFilter("active")} />

        {/* Project list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            {statusFilter === "archived" ? <Archive className="h-8 w-8 text-muted-foreground/40" /> : <FolderOpen className="h-8 w-8 text-muted-foreground/40" />}
            <p className="text-sm font-medium text-muted-foreground">
              {statusFilter === "all" ? "No projects yet" : `No ${STATUS_FILTERS.find((f) => f.id === statusFilter)?.label.toLowerCase()} projects`}
            </p>
            {statusFilter === "all" && (
              <p className="text-xs text-muted-foreground/70">Create a project above to organize your tasks.</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project as Project} onClick={() => setSelectedProject(project as Project)} />
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onDeleted={() => setSelectedProject(null)}
        />
      )}
    </>
  );
}
