/**
 * Mindline Showcase — in-memory demo data store.
 *
 * Replaces the real Mindline backend (Express + PostgreSQL) with seeded
 * in-memory data so the showcase runs entirely in the browser. Data resets
 * on page reload.
 */
import type {
  DailyBriefing,
  DayPlan,
  InboxItem,
  InboxItemInput,
  InboxItemUpdate,
  InboxStats,
  ProcessInboxItemInput,
  ProcessInboxItemResult,
  ProductivityStats,
  Project,
  ProjectInput,
  ProjectUpdate,
  Reminder,
  ReminderEvent,
  ReminderInput,
  ReminderStats,
  ReminderUpdate,
  ReminderWithHistory,
  ScheduledTask,
  SnoozeReminderInput,
  Task,
  TaskInput,
  TaskStats,
  TaskUpdate,
  Workspace,
  WorkspaceInput,
} from "./types";

// ---------------------------------------------------------------------------
// Time helpers (seed data is always relative to "now" so the demo feels live)
// ---------------------------------------------------------------------------

const now = () => new Date();
const iso = (d: Date) => d.toISOString();
const minutesFromNow = (m: number) => iso(new Date(Date.now() + m * 60_000));
const hoursFromNow = (h: number) => minutesFromNow(h * 60);
const daysFromNow = (d: number) => minutesFromNow(d * 24 * 60);
const todayAt = (hour: number, minute = 0) => {
  const d = now();
  d.setHours(hour, minute, 0, 0);
  return iso(d);
};
const nextAt = (hour: number, minute = 0) => {
  const d = now();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return iso(d);
};

// ---------------------------------------------------------------------------
// Internal record shapes (superset of the public API types)
// ---------------------------------------------------------------------------

interface WorkspaceRec {
  id: number;
  name: string;
  createdAt: string;
}

interface ProjectRec {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
  color: string;
  status: Project["status"];
  dueDate: string | null;
  createdAt: string;
}

interface TaskRec {
  id: number;
  workspaceId: number;
  title: string;
  description: string | null;
  priority: Task["priority"];
  completed: boolean;
  completedAt: string | null;
  deadline: string | null;
  estimatedMinutes: number | null;
  tags: string[];
  aiScore: number | null;
  scheduledTime: string | null;
  projectId: number | null;
  dependsOn: number[];
  createdAt: string;
  updatedAt: string;
}

interface InboxRec extends InboxItem {}

interface ReminderRec extends Reminder {}

interface ReminderEventRec extends ReminderEvent {}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

let nextId = 1000;
const newId = () => ++nextId;

let currentWorkspaceId = 1;

export function setWorkspaceId(id: number | null): void {
  if (id != null && Number.isFinite(id) && id > 0) currentWorkspaceId = id;
}

const workspaces: WorkspaceRec[] = [
  { id: 1, name: "Personal", createdAt: daysFromNow(-42) },
  { id: 2, name: "Work", createdAt: daysFromNow(-38) },
];

const projects: ProjectRec[] = [
  {
    id: 1,
    workspaceId: 1,
    name: "Home Studio Setup",
    description: "Turn the spare room into a small recording space",
    color: "#8b5cf6",
    status: "active",
    dueDate: daysFromNow(12),
    createdAt: daysFromNow(-20),
  },
  {
    id: 2,
    workspaceId: 1,
    name: "Learn Spanish",
    description: "Reach conversational level before the trip",
    color: "#22c55e",
    status: "planned",
    dueDate: null,
    createdAt: daysFromNow(-15),
  },
  {
    id: 3,
    workspaceId: 2,
    name: "Q3 Product Launch",
    description: "Everything needed to ship v2.0 to customers",
    color: "#f97316",
    status: "active",
    dueDate: daysFromNow(5),
    createdAt: daysFromNow(-30),
  },
  {
    id: 4,
    workspaceId: 2,
    name: "Design System Refresh",
    description: "Blocked on brand guidelines from the agency",
    color: "#0ea5e9",
    status: "blocked",
    dueDate: daysFromNow(-2),
    createdAt: daysFromNow(-25),
  },
];

const tasks: TaskRec[] = [
  {
    id: 1,
    workspaceId: 1,
    title: "Order acoustic foam panels",
    description: "Compare 2\" vs 3\" thickness before ordering",
    priority: "medium",
    completed: false,
    completedAt: null,
    deadline: daysFromNow(2),
    estimatedMinutes: 30,
    tags: ["shopping"],
    aiScore: 62,
    scheduledTime: null,
    projectId: 1,
    dependsOn: [],
    createdAt: daysFromNow(-6),
    updatedAt: daysFromNow(-6),
  },
  {
    id: 2,
    workspaceId: 1,
    title: "Install soundproofing",
    description: null,
    priority: "low",
    completed: false,
    completedAt: null,
    deadline: daysFromNow(9),
    estimatedMinutes: 120,
    tags: ["diy"],
    aiScore: null,
    scheduledTime: null,
    projectId: 1,
    dependsOn: [1],
    createdAt: daysFromNow(-6),
    updatedAt: daysFromNow(-6),
  },
  {
    id: 3,
    workspaceId: 1,
    title: "Book Spanish tutor trial lesson",
    description: null,
    priority: "high",
    completed: false,
    completedAt: null,
    deadline: todayAt(18),
    estimatedMinutes: 15,
    tags: ["learning"],
    aiScore: 88,
    scheduledTime: null,
    projectId: 2,
    dependsOn: [],
    createdAt: daysFromNow(-3),
    updatedAt: daysFromNow(-3),
  },
  {
    id: 4,
    workspaceId: 1,
    title: "Renew passport",
    description: "Expires in 4 months — needed for the trip",
    priority: "high",
    completed: false,
    completedAt: null,
    deadline: daysFromNow(-1),
    estimatedMinutes: 45,
    tags: ["errands"],
    aiScore: 93,
    scheduledTime: null,
    projectId: null,
    dependsOn: [],
    createdAt: daysFromNow(-10),
    updatedAt: daysFromNow(-10),
  },
  {
    id: 5,
    workspaceId: 1,
    title: "Weekly meal prep",
    description: null,
    priority: "medium",
    completed: true,
    completedAt: hoursFromNow(-5),
    deadline: null,
    estimatedMinutes: 90,
    tags: ["health"],
    aiScore: null,
    scheduledTime: null,
    projectId: null,
    dependsOn: [],
    createdAt: daysFromNow(-2),
    updatedAt: hoursFromNow(-5),
  },
  {
    id: 6,
    workspaceId: 1,
    title: "Practice Duolingo streak",
    description: null,
    priority: "low",
    completed: true,
    completedAt: hoursFromNow(-26),
    deadline: null,
    estimatedMinutes: 15,
    tags: ["learning"],
    aiScore: null,
    scheduledTime: null,
    projectId: 2,
    dependsOn: [],
    createdAt: daysFromNow(-4),
    updatedAt: hoursFromNow(-26),
  },
  {
    id: 7,
    workspaceId: 2,
    title: "Finalize launch pricing",
    description: "Sync with finance on tier structure",
    priority: "high",
    completed: false,
    completedAt: null,
    deadline: daysFromNow(1),
    estimatedMinutes: 60,
    tags: ["launch", "pricing"],
    aiScore: 95,
    scheduledTime: null,
    projectId: 3,
    dependsOn: [],
    createdAt: daysFromNow(-8),
    updatedAt: daysFromNow(-8),
  },
  {
    id: 8,
    workspaceId: 2,
    title: "Write release announcement",
    description: null,
    priority: "high",
    completed: false,
    completedAt: null,
    deadline: daysFromNow(3),
    estimatedMinutes: 90,
    tags: ["launch", "marketing"],
    aiScore: 81,
    scheduledTime: null,
    projectId: 3,
    dependsOn: [7],
    createdAt: daysFromNow(-7),
    updatedAt: daysFromNow(-7),
  },
  {
    id: 9,
    workspaceId: 2,
    title: "QA regression pass on staging",
    description: null,
    priority: "medium",
    completed: false,
    completedAt: null,
    deadline: daysFromNow(2),
    estimatedMinutes: 180,
    tags: ["launch", "qa"],
    aiScore: 74,
    scheduledTime: null,
    projectId: 3,
    dependsOn: [],
    createdAt: daysFromNow(-5),
    updatedAt: daysFromNow(-5),
  },
  {
    id: 10,
    workspaceId: 2,
    title: "Chase agency for brand guidelines",
    description: "Design system work is blocked on this",
    priority: "medium",
    completed: false,
    completedAt: null,
    deadline: todayAt(16),
    estimatedMinutes: 15,
    tags: ["design"],
    aiScore: 69,
    scheduledTime: null,
    projectId: 4,
    dependsOn: [],
    createdAt: daysFromNow(-4),
    updatedAt: daysFromNow(-4),
  },
  {
    id: 11,
    workspaceId: 2,
    title: "Update onboarding docs",
    description: null,
    priority: "low",
    completed: false,
    completedAt: null,
    deadline: null,
    estimatedMinutes: 45,
    tags: ["docs"],
    aiScore: null,
    scheduledTime: null,
    projectId: null,
    dependsOn: [],
    createdAt: daysFromNow(-12),
    updatedAt: daysFromNow(-12),
  },
  {
    id: 12,
    workspaceId: 2,
    title: "Prepare launch demo script",
    description: null,
    priority: "medium",
    completed: true,
    completedAt: hoursFromNow(-3),
    deadline: null,
    estimatedMinutes: 60,
    tags: ["launch"],
    aiScore: null,
    scheduledTime: null,
    projectId: 3,
    dependsOn: [],
    createdAt: daysFromNow(-3),
    updatedAt: hoursFromNow(-3),
  },
  {
    id: 13,
    workspaceId: 2,
    title: "Review support ticket backlog",
    description: null,
    priority: "low",
    completed: true,
    completedAt: hoursFromNow(-30),
    deadline: null,
    estimatedMinutes: 30,
    tags: ["support"],
    aiScore: null,
    scheduledTime: null,
    projectId: null,
    dependsOn: [],
    createdAt: daysFromNow(-6),
    updatedAt: hoursFromNow(-30),
  },
];

const inboxItems: InboxRec[] = [
  {
    id: 1,
    title: "Look into standing desk options",
    notes: "Colleague recommended the Jarvis frame",
    processed: false,
    processedAt: null,
    createdAt: hoursFromNow(-4),
  },
  {
    id: 2,
    title: "Idea: automate weekly status report",
    notes: null,
    processed: false,
    processedAt: null,
    createdAt: hoursFromNow(-28),
  },
  {
    id: 3,
    title: "Sign up for conference early-bird tickets",
    notes: "Deadline end of the month",
    processed: true,
    processedAt: daysFromNow(-1),
    createdAt: daysFromNow(-2),
  },
];

const reminders: ReminderRec[] = [
  {
    id: 1,
    title: "Daily standup",
    notes: "Zoom link in calendar invite",
    kind: "reminder",
    status: "active",
    targetType: "event",
    taskId: null,
    projectId: null,
    triggerAt: nextAt(9, 30),
    recurrence: "weekdays",
    snoozedUntil: null,
    lastTriggeredAt: hoursFromNow(-25),
    source: "user",
    workspaceId: 2,
    createdAt: daysFromNow(-14),
    updatedAt: daysFromNow(-14),
  },
  {
    id: 2,
    title: "Submit expense report",
    notes: "Finance closes the books at 5pm",
    kind: "alarm",
    status: "active",
    targetType: "event",
    taskId: null,
    projectId: null,
    triggerAt: hoursFromNow(2),
    recurrence: "none",
    snoozedUntil: null,
    lastTriggeredAt: null,
    source: "user",
    workspaceId: null,
    createdAt: hoursFromNow(-20),
    updatedAt: hoursFromNow(-20),
  },
  {
    id: 3,
    title: "Follow up on launch pricing",
    notes: null,
    kind: "reminder",
    status: "snoozed",
    targetType: "task",
    taskId: 7,
    projectId: null,
    triggerAt: hoursFromNow(-1),
    recurrence: "none",
    snoozedUntil: minutesFromNow(45),
    lastTriggeredAt: hoursFromNow(-1),
    source: "ai",
    workspaceId: 2,
    createdAt: daysFromNow(-1),
    updatedAt: hoursFromNow(-1),
  },
  {
    id: 4,
    title: "Water the plants",
    notes: null,
    kind: "reminder",
    status: "active",
    targetType: "event",
    taskId: null,
    projectId: null,
    triggerAt: daysFromNow(1),
    recurrence: "weekly",
    snoozedUntil: null,
    lastTriggeredAt: null,
    source: "user",
    workspaceId: 1,
    createdAt: daysFromNow(-7),
    updatedAt: daysFromNow(-7),
  },
  {
    id: 5,
    title: "Book dentist appointment",
    notes: null,
    kind: "reminder",
    status: "completed",
    targetType: "event",
    taskId: null,
    projectId: null,
    triggerAt: daysFromNow(-2),
    recurrence: "none",
    snoozedUntil: null,
    lastTriggeredAt: daysFromNow(-2),
    source: "user",
    workspaceId: 1,
    createdAt: daysFromNow(-5),
    updatedAt: daysFromNow(-2),
  },
];

const reminderEvents: ReminderEventRec[] = [
  { id: 1, reminderId: 1, type: "created", actor: "user", detail: null, createdAt: daysFromNow(-14) },
  { id: 2, reminderId: 1, type: "triggered", actor: "system", detail: null, createdAt: hoursFromNow(-25) },
  { id: 3, reminderId: 2, type: "created", actor: "user", detail: null, createdAt: hoursFromNow(-20) },
  { id: 4, reminderId: 3, type: "created", actor: "ai", detail: "Created from task deadline analysis", createdAt: daysFromNow(-1) },
  { id: 5, reminderId: 3, type: "triggered", actor: "system", detail: null, createdAt: hoursFromNow(-1) },
  { id: 6, reminderId: 3, type: "snoozed", actor: "user", detail: "Snoozed 45 minutes", createdAt: hoursFromNow(-1) },
  { id: 7, reminderId: 4, type: "created", actor: "user", detail: null, createdAt: daysFromNow(-7) },
  { id: 8, reminderId: 5, type: "created", actor: "user", detail: null, createdAt: daysFromNow(-5) },
  { id: 9, reminderId: 5, type: "completed", actor: "user", detail: null, createdAt: daysFromNow(-2) },
];

// ---------------------------------------------------------------------------
// Serialization (enrichment mirrors the real API responses)
// ---------------------------------------------------------------------------

function toTask(rec: TaskRec): Task {
  const project = rec.projectId != null ? projects.find((p) => p.id === rec.projectId) : undefined;
  const blocking = rec.dependsOn
    .map((depId) => tasks.find((t) => t.id === depId))
    .filter((t): t is TaskRec => !!t && !t.completed)
    .map((t) => ({ id: t.id, title: t.title }));
  return {
    id: rec.id,
    title: rec.title,
    description: rec.description,
    priority: rec.priority,
    completed: rec.completed,
    deadline: rec.deadline,
    estimatedMinutes: rec.estimatedMinutes,
    tags: rec.tags,
    aiScore: rec.aiScore,
    scheduledTime: rec.scheduledTime,
    projectId: rec.projectId,
    projectName: project?.name ?? null,
    blockingTasks: blocking,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}

function toProject(rec: ProjectRec): Project {
  const projectTasks = tasks.filter((t) => t.projectId === rec.id);
  const completedCount = projectTasks.filter((t) => t.completed).length;
  const taskCount = projectTasks.length;
  const isOverdue =
    !!rec.dueDate &&
    new Date(rec.dueDate) < now() &&
    rec.status !== "completed" &&
    rec.status !== "archived";
  return {
    id: rec.id,
    name: rec.name,
    description: rec.description,
    color: rec.color,
    status: rec.status,
    dueDate: rec.dueDate,
    isOverdue,
    taskCount,
    completedCount,
    completionPercentage: taskCount === 0 ? 0 : Math.round((completedCount / taskCount) * 100),
    createdAt: rec.createdAt,
  };
}

const wsTasks = (wsId: number = currentWorkspaceId) =>
  tasks.filter((t) => t.workspaceId === wsId);
const wsProjects = (wsId: number = currentWorkspaceId) =>
  projects.filter((p) => p.workspaceId === wsId);

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export const listWorkspaces = (): Workspace[] => workspaces.map((w) => ({ ...w }));

export function createWorkspace(input: WorkspaceInput): Workspace {
  const ws: WorkspaceRec = { id: newId(), name: input.name, createdAt: iso(now()) };
  workspaces.push(ws);
  return { ...ws };
}

export function updateWorkspace(id: number, input: WorkspaceInput): Workspace {
  const ws = workspaces.find((w) => w.id === id);
  if (!ws) throw new Error("Workspace not found");
  ws.name = input.name;
  return { ...ws };
}

export function deleteWorkspace(id: number): void {
  if (workspaces.length <= 1) throw new Error("Cannot delete the last workspace");
  const idx = workspaces.findIndex((w) => w.id === id);
  if (idx === -1) throw new Error("Workspace not found");
  workspaces.splice(idx, 1);
  for (let i = tasks.length - 1; i >= 0; i--) if (tasks[i].workspaceId === id) tasks.splice(i, 1);
  for (let i = projects.length - 1; i >= 0; i--) if (projects[i].workspaceId === id) projects.splice(i, 1);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function listProjects(status?: string, workspaceIdOverride?: number): Project[] {
  let list = wsProjects(workspaceIdOverride);
  if (status && status !== "all") list = list.filter((p) => p.status === status);
  return list.map(toProject);
}

export function createProject(input: ProjectInput): Project {
  const rec: ProjectRec = {
    id: newId(),
    workspaceId: currentWorkspaceId,
    name: input.name,
    description: input.description ?? null,
    color: input.color ?? "#6366f1",
    status: input.status ?? "planned",
    dueDate: input.dueDate ?? null,
    createdAt: iso(now()),
  };
  projects.push(rec);
  return toProject(rec);
}

export function updateProject(id: number, input: ProjectUpdate): Project {
  const rec = projects.find((p) => p.id === id);
  if (!rec) throw new Error("Project not found");
  if (input.name !== undefined) rec.name = input.name;
  if (input.description !== undefined) rec.description = input.description;
  if (input.color !== undefined) rec.color = input.color;
  if (input.status !== undefined) rec.status = input.status;
  if (input.dueDate !== undefined) rec.dueDate = input.dueDate;
  return toProject(rec);
}

export function deleteProject(id: number): void {
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Project not found");
  projects.splice(idx, 1);
  for (const t of tasks) if (t.projectId === id) t.projectId = null;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function listTasks(
  params?: { status?: string; projectId?: number },
  workspaceIdOverride?: number,
): Task[] {
  let list = wsTasks(workspaceIdOverride);
  if (params?.status === "pending") list = list.filter((t) => !t.completed);
  if (params?.status === "completed") list = list.filter((t) => t.completed);
  if (params?.projectId != null) list = list.filter((t) => t.projectId === params.projectId);
  return list.map(toTask);
}

export function createTask(input: TaskInput): Task {
  const rec: TaskRec = {
    id: newId(),
    workspaceId: currentWorkspaceId,
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? "medium",
    completed: false,
    completedAt: null,
    deadline: input.deadline ?? null,
    estimatedMinutes: input.estimatedMinutes ?? null,
    tags: input.tags ?? [],
    aiScore: null,
    scheduledTime: null,
    projectId: input.projectId ?? null,
    dependsOn: [],
    createdAt: iso(now()),
    updatedAt: iso(now()),
  };
  tasks.push(rec);
  return toTask(rec);
}

export function updateTask(id: number, input: TaskUpdate): Task {
  const rec = tasks.find((t) => t.id === id);
  if (!rec) throw new Error("Task not found");
  if (input.title !== undefined) rec.title = input.title;
  if (input.description !== undefined) rec.description = input.description;
  if (input.priority !== undefined) rec.priority = input.priority;
  if (input.deadline !== undefined) rec.deadline = input.deadline;
  if (input.estimatedMinutes !== undefined) rec.estimatedMinutes = input.estimatedMinutes;
  if (input.tags !== undefined) rec.tags = input.tags;
  if (input.projectId !== undefined) rec.projectId = input.projectId;
  rec.updatedAt = iso(now());
  return toTask(rec);
}

export function deleteTask(id: number): void {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Task not found");
  tasks.splice(idx, 1);
  for (const t of tasks) t.dependsOn = t.dependsOn.filter((d) => d !== id);
}

export function completeTask(id: number, completed: boolean): Task {
  const rec = tasks.find((t) => t.id === id);
  if (!rec) throw new Error("Task not found");
  rec.completed = completed;
  rec.completedAt = completed ? iso(now()) : null;
  rec.updatedAt = iso(now());
  return toTask(rec);
}

export function addTaskDependency(id: number, dependsOnTaskId: number): Task {
  const rec = tasks.find((t) => t.id === id);
  if (!rec) throw new Error("Task not found");
  if (dependsOnTaskId === id) throw new Error("A task cannot depend on itself");
  if (!rec.dependsOn.includes(dependsOnTaskId)) rec.dependsOn.push(dependsOnTaskId);
  return toTask(rec);
}

export function removeTaskDependency(id: number, dependsOnId: number): void {
  const rec = tasks.find((t) => t.id === id);
  if (!rec) throw new Error("Task not found");
  rec.dependsOn = rec.dependsOn.filter((d) => d !== dependsOnId);
}

export function getTaskStats(): TaskStats {
  const list = wsTasks();
  const completed = list.filter((t) => t.completed);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayCompleted = completed.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= startOfDay,
  ).length;
  return {
    total: list.length,
    completed: completed.length,
    pending: list.length - completed.length,
    highPriority: list.filter((t) => !t.completed && t.priority === "high").length,
    completionRate: list.length === 0 ? 0 : Math.round((completed.length / list.length) * 100),
    streak: 4,
    todayCompleted,
    todayTotal: list.filter((t) => t.deadline && new Date(t.deadline) >= startOfDay && new Date(t.deadline) < new Date(startOfDay.getTime() + 86_400_000)).length + todayCompleted,
  };
}

// ---------------------------------------------------------------------------
// Analytics & "AI" features (simulated — no real model behind the demo)
// ---------------------------------------------------------------------------

export function getProductivityStats(): ProductivityStats {
  const shape = [0, 0, 0, 0, 0, 0, 0, 1, 2, 4, 5, 3, 1, 2, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0];
  return {
    completionsByHour: shape.map((count, hour) => ({ hour, count })),
    mostProductiveHours: [10, 14, 9],
    totalCompletions: shape.reduce((a, b) => a + b, 0),
    avgDailyCompletions: 3.6,
    peakStartHour: 9,
  };
}

export function getDailyBriefing(): DailyBriefing {
  const list = wsTasks();
  const pending = list.filter((t) => !t.completed);
  const overdue = pending.filter((t) => t.deadline && new Date(t.deadline) < now());
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 86_400_000);
  const dueToday = pending.filter(
    (t) => t.deadline && new Date(t.deadline) >= startOfDay && new Date(t.deadline) < endOfDay,
  );
  const completedToday = list.filter(
    (t) => t.completedAt && new Date(t.completedAt) >= startOfDay,
  );
  const highPriority = pending.filter((t) => t.priority === "high");
  const blocked = pending.filter((t) =>
    t.dependsOn.some((d) => {
      const dep = tasks.find((x) => x.id === d);
      return dep && !dep.completed;
    }),
  );
  const projList = wsProjects().map(toProject);
  const atRisk = projList.filter((p) => p.isOverdue || p.status === "blocked");
  const focus = highPriority[0] ?? dueToday[0] ?? pending[0];

  return {
    summary: `You have ${pending.length} pending tasks — ${overdue.length} overdue and ${dueToday.length} due today. Momentum is good: ${completedToday.length} already completed today. (Simulated AI briefing for demo purposes.)`,
    todaysFocus: focus
      ? `"${focus.title}" is your highest-leverage task right now${focus.deadline ? " — it has the nearest deadline" : ""}.`
      : "Nothing pending — enjoy the clear runway.",
    biggestRisk: overdue.length > 0
      ? `"${overdue[0].title}" is overdue and will keep slipping unless scheduled today.`
      : atRisk.length > 0
        ? `Project "${atRisk[0].name}" is ${atRisk[0].status === "blocked" ? "blocked" : "past its due date"}.`
        : "No significant risks detected in this workspace.",
    recommendedAction: blocked.length > 0
      ? `Unblock "${blocked[0].title}" by finishing its dependency first.`
      : focus
        ? `Block ${focus.estimatedMinutes ?? 30} minutes this morning for "${focus.title}".`
        : "Capture anything on your mind into the Inbox.",
    estimatedCompletion: Math.min(95, 40 + completedToday.length * 15),
    generatedAt: iso(now()),
    stats: {
      pendingCount: pending.length,
      overdueCount: overdue.length,
      highPriorityCount: highPriority.length,
      dueTodayCount: dueToday.length,
      completedTodayCount: completedToday.length,
    },
    blockedTaskCount: blocked.length,
    projectsSummary: projList.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      status: p.status,
      dueDate: p.dueDate,
      isOverdue: p.isOverdue,
      completionPercentage: p.completionPercentage,
      taskCount: p.taskCount,
    })),
    atRiskProjects: atRisk.map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      status: p.status,
      dueDate: p.dueDate,
      isOverdue: p.isOverdue,
      completionPercentage: p.completionPercentage,
      taskCount: p.taskCount,
    })),
  };
}

export function planDay(): DayPlan {
  const pending = wsTasks().filter((t) => !t.completed);
  const blockedIds = new Set(
    pending
      .filter((t) =>
        t.dependsOn.some((d) => {
          const dep = tasks.find((x) => x.id === d);
          return dep && !dep.completed;
        }),
      )
      .map((t) => t.id),
  );
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const schedulable = pending
    .filter((t) => !blockedIds.has(t.id))
    .sort((a, b) => {
      const p = rank[a.priority] - rank[b.priority];
      if (p !== 0) return p;
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    });

  const scheduled: ScheduledTask[] = [];
  const cursor = new Date();
  cursor.setHours(9, 0, 0, 0);
  if (cursor < now()) cursor.setTime(Date.now() + 15 * 60_000);
  const endOfWorkday = new Date();
  endOfWorkday.setHours(18, 0, 0, 0);

  for (const t of schedulable) {
    const duration = (t.estimatedMinutes ?? 30) * 60_000;
    if (cursor.getTime() + duration > endOfWorkday.getTime() || scheduled.length >= 6) break;
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + duration);
    scheduled.push({
      task: toTask(t),
      startTime: iso(start),
      endTime: iso(end),
      reason:
        t.priority === "high"
          ? "High priority — tackled while energy is highest"
          : t.deadline
            ? "Deadline approaching — scheduled before lower-urgency work"
            : "Fits the remaining focus window",
    });
    cursor.setTime(end.getTime() + 15 * 60_000);
  }

  const scheduledIds = new Set(scheduled.map((s) => s.task.id));
  const unscheduled = pending.filter((t) => !scheduledIds.has(t.id)).map(toTask);

  return {
    date: iso(now()).slice(0, 10),
    scheduledTasks: scheduled,
    unscheduledTasks: unscheduled,
    summary: `Planned ${scheduled.length} tasks with 15-minute buffers, prioritizing deadlines and high-priority work. ${unscheduled.length} tasks left unscheduled${blockedIds.size > 0 ? `, including ${blockedIds.size} blocked by dependencies` : ""}. (Simulated AI plan for demo purposes.)`,
  };
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

export function listInboxItems(status?: string): InboxItem[] {
  let list = inboxItems.slice();
  if (status === "unprocessed") list = list.filter((i) => !i.processed);
  if (status === "processed") list = list.filter((i) => i.processed);
  return list
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((i) => ({ ...i }));
}

export function getInboxStats(): InboxStats {
  return {
    total: inboxItems.length,
    unprocessed: inboxItems.filter((i) => !i.processed).length,
  };
}

export function createInboxItem(input: InboxItemInput): InboxItem {
  const item: InboxRec = {
    id: newId(),
    title: input.title,
    notes: input.notes ?? null,
    processed: false,
    processedAt: null,
    createdAt: iso(now()),
  };
  inboxItems.push(item);
  return { ...item };
}

export function updateInboxItem(id: number, input: InboxItemUpdate): InboxItem {
  const item = inboxItems.find((i) => i.id === id);
  if (!item) throw new Error("Inbox item not found");
  if (input.title !== undefined) item.title = input.title;
  if (input.notes !== undefined) item.notes = input.notes;
  if (input.processed !== undefined) {
    item.processed = input.processed;
    item.processedAt = input.processed ? iso(now()) : null;
  }
  return { ...item };
}

export function deleteInboxItem(id: number): void {
  const idx = inboxItems.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Inbox item not found");
  inboxItems.splice(idx, 1);
}

export function processInboxItem(id: number, input: ProcessInboxItemInput): ProcessInboxItemResult {
  const item = inboxItems.find((i) => i.id === id);
  if (!item) throw new Error("Inbox item not found");

  let createdId: number;
  if (input.target === "project") {
    const rec: ProjectRec = {
      id: newId(),
      workspaceId: input.workspaceId,
      name: item.title,
      description: item.notes ?? null,
      color: "#6366f1",
      status: "planned",
      dueDate: input.deadline ?? null,
      createdAt: iso(now()),
    };
    projects.push(rec);
    createdId = rec.id;
  } else {
    const rec: TaskRec = {
      id: newId(),
      workspaceId: input.workspaceId,
      title: item.title,
      description: item.notes ?? null,
      priority: input.priority ?? "medium",
      completed: false,
      completedAt: null,
      deadline: input.deadline ?? null,
      estimatedMinutes: null,
      tags: [],
      aiScore: null,
      scheduledTime: null,
      projectId: input.projectId ?? null,
      dependsOn: [],
      createdAt: iso(now()),
      updatedAt: iso(now()),
    };
    tasks.push(rec);
    createdId = rec.id;
  }

  item.processed = true;
  item.processedAt = iso(now());
  return { item: { ...item }, createdType: input.target, createdId };
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

function addEvent(reminderId: number, type: ReminderEvent["type"], actor: ReminderEvent["actor"], detail?: string) {
  reminderEvents.push({
    id: newId(),
    reminderId,
    type,
    actor,
    detail: detail ?? null,
    createdAt: iso(now()),
  });
}

function nextOccurrence(from: Date, recurrence: Reminder["recurrence"]): Date {
  const d = new Date(from);
  switch (recurrence) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekdays":
      do {
        d.setDate(d.getDate() + 1);
      } while (d.getDay() === 0 || d.getDay() === 6);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    default:
      break;
  }
  return d;
}

export function listReminders(params?: { status?: string; kind?: string; targetType?: string }): Reminder[] {
  let list = reminders.slice();
  if (params?.status && params.status !== "all") list = list.filter((r) => r.status === params.status);
  if (params?.kind && params.kind !== "all") list = list.filter((r) => r.kind === params.kind);
  if (params?.targetType && params.targetType !== "all") list = list.filter((r) => r.targetType === params.targetType);
  return list
    .sort((a, b) => {
      const at = a.status === "snoozed" && a.snoozedUntil ? a.snoozedUntil : a.triggerAt;
      const bt = b.status === "snoozed" && b.snoozedUntil ? b.snoozedUntil : b.triggerAt;
      return new Date(at).getTime() - new Date(bt).getTime();
    })
    .map((r) => ({ ...r }));
}

export function listDueReminders(): Reminder[] {
  const nowMs = Date.now();
  return reminders
    .filter((r) => {
      if (r.status === "active") return new Date(r.triggerAt).getTime() <= nowMs;
      if (r.status === "snoozed" && r.snoozedUntil) return new Date(r.snoozedUntil).getTime() <= nowMs;
      return false;
    })
    .map((r) => ({ ...r }));
}

export function getReminderStats(): ReminderStats {
  return {
    total: reminders.length,
    active: reminders.filter((r) => r.status === "active").length,
    due: listDueReminders().length,
    snoozed: reminders.filter((r) => r.status === "snoozed").length,
  };
}

export function getReminder(id: number): ReminderWithHistory {
  const r = reminders.find((x) => x.id === id);
  if (!r) throw new Error("Reminder not found");
  return { reminder: { ...r }, history: getReminderHistory(id) };
}

export function getReminderHistory(id: number): ReminderEvent[] {
  return reminderEvents
    .filter((e) => e.reminderId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((e) => ({ ...e }));
}

export function createReminder(input: ReminderInput): Reminder {
  const r: ReminderRec = {
    id: newId(),
    title: input.title,
    notes: input.notes ?? null,
    kind: input.kind ?? "reminder",
    status: "active",
    targetType: input.targetType ?? "event",
    taskId: input.taskId ?? null,
    projectId: input.projectId ?? null,
    triggerAt: input.triggerAt,
    recurrence: input.recurrence ?? "none",
    snoozedUntil: null,
    lastTriggeredAt: null,
    source: input.source ?? "user",
    workspaceId: input.workspaceId ?? null,
    createdAt: iso(now()),
    updatedAt: iso(now()),
  };
  reminders.push(r);
  addEvent(r.id, "created", r.source === "ai" ? "ai" : "user");
  return { ...r };
}

export function updateReminder(id: number, input: ReminderUpdate): Reminder {
  const r = reminders.find((x) => x.id === id);
  if (!r) throw new Error("Reminder not found");
  if (input.title !== undefined) r.title = input.title;
  if (input.notes !== undefined) r.notes = input.notes;
  if (input.kind !== undefined) r.kind = input.kind;
  if (input.status !== undefined) r.status = input.status;
  if (input.targetType !== undefined) r.targetType = input.targetType;
  if (input.taskId !== undefined) r.taskId = input.taskId;
  if (input.projectId !== undefined) r.projectId = input.projectId;
  if (input.triggerAt !== undefined) {
    r.triggerAt = input.triggerAt;
    if (r.status === "snoozed") {
      r.status = "active";
      r.snoozedUntil = null;
    }
  }
  if (input.recurrence !== undefined) r.recurrence = input.recurrence;
  if (input.workspaceId !== undefined) r.workspaceId = input.workspaceId;
  r.updatedAt = iso(now());
  addEvent(id, "updated", input.actor ?? "user");
  return { ...r };
}

export function deleteReminder(id: number): void {
  const idx = reminders.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error("Reminder not found");
  reminders.splice(idx, 1);
}

export function snoozeReminder(id: number, input: SnoozeReminderInput): Reminder {
  const r = reminders.find((x) => x.id === id);
  if (!r) throw new Error("Reminder not found");
  const until = input.until ?? minutesFromNow(input.minutes ?? 10);
  r.status = "snoozed";
  r.snoozedUntil = until;
  r.updatedAt = iso(now());
  addEvent(id, "snoozed", input.actor ?? "user", input.minutes ? `Snoozed ${input.minutes} minutes` : undefined);
  return { ...r };
}

export function dismissReminder(id: number, actor?: ReminderEvent["actor"]): Reminder {
  const r = reminders.find((x) => x.id === id);
  if (!r) throw new Error("Reminder not found");
  if (r.recurrence !== "none") {
    r.triggerAt = iso(nextOccurrence(new Date(Math.max(new Date(r.triggerAt).getTime(), Date.now())), r.recurrence));
    r.status = "active";
    r.snoozedUntil = null;
    addEvent(id, "rescheduled", "system", "Recurring reminder advanced to next occurrence");
  } else {
    r.status = "dismissed";
  }
  r.updatedAt = iso(now());
  addEvent(id, "dismissed", actor ?? "user");
  return { ...r };
}

export function completeReminder(id: number, actor?: ReminderEvent["actor"]): Reminder {
  const r = reminders.find((x) => x.id === id);
  if (!r) throw new Error("Reminder not found");
  if (r.recurrence !== "none") {
    r.triggerAt = iso(nextOccurrence(new Date(Math.max(new Date(r.triggerAt).getTime(), Date.now())), r.recurrence));
    r.status = "active";
    r.snoozedUntil = null;
    addEvent(id, "rescheduled", "system", "Recurring reminder advanced to next occurrence");
  } else {
    r.status = "completed";
  }
  r.updatedAt = iso(now());
  addEvent(id, "completed", actor ?? "user");
  return { ...r };
}
