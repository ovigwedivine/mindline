/**
 * Mindline Showcase — API type definitions.
 *
 * These mirror the shapes of the original Mindline API so the demo
 * frontend runs unmodified against the in-memory mock data layer.
 */
export interface HealthStatus {
  status: string;
}

export interface Workspace {
  id: number;
  name: string;
  createdAt: string;
}

export interface WorkspaceInput {
  /** @minLength 1 */
  name: string;
}

export interface BlockingTask {
  id: number;
  title: string;
}

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];


export const TaskPriority = {
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

export interface Task {
  id: number;
  title: string;
  /** @nullable */
  description?: string | null;
  priority: TaskPriority;
  completed: boolean;
  /** @nullable */
  deadline?: string | null;
  /** @nullable */
  estimatedMinutes?: number | null;
  tags?: string[];
  /** @nullable */
  aiScore?: number | null;
  /** @nullable */
  scheduledTime?: string | null;
  /** @nullable */
  projectId?: number | null;
  /** @nullable */
  projectName?: string | null;
  blockingTasks?: BlockingTask[];
  createdAt: string;
  updatedAt?: string;
}

export type TaskInputPriority = typeof TaskInputPriority[keyof typeof TaskInputPriority];


export const TaskInputPriority = {
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

export interface TaskInput {
  /** @minLength 1 */
  title: string;
  description?: string;
  priority?: TaskInputPriority;
  deadline?: string;
  /** @minimum 1 */
  estimatedMinutes?: number;
  tags?: string[];
  projectId?: number;
}

export type TaskUpdatePriority = typeof TaskUpdatePriority[keyof typeof TaskUpdatePriority];


export const TaskUpdatePriority = {
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

export interface TaskUpdate {
  /** @minLength 1 */
  title?: string;
  description?: string;
  priority?: TaskUpdatePriority;
  deadline?: string;
  /** @minimum 1 */
  estimatedMinutes?: number;
  tags?: string[];
  /** @nullable */
  projectId?: number | null;
}

export interface TaskCompleteInput {
  completed: boolean;
}

export interface TaskDependencyInput {
  dependsOnTaskId: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  highPriority: number;
  completionRate: number;
  streak: number;
  todayCompleted?: number;
  todayTotal?: number;
}

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];


export const ProjectStatus = {
  planned: 'planned',
  active: 'active',
  blocked: 'blocked',
  completed: 'completed',
  archived: 'archived',
} as const;

export interface Project {
  id: number;
  name: string;
  /** @nullable */
  description?: string | null;
  color: string;
  status: ProjectStatus;
  /** @nullable */
  dueDate?: string | null;
  /** true when dueDate is in the past and status is not completed/archived */
  isOverdue?: boolean;
  taskCount: number;
  completedCount: number;
  completionPercentage: number;
  createdAt: string;
}

export type ProjectInputStatus = typeof ProjectInputStatus[keyof typeof ProjectInputStatus];


export const ProjectInputStatus = {
  planned: 'planned',
  active: 'active',
  blocked: 'blocked',
  completed: 'completed',
  archived: 'archived',
} as const;

export interface ProjectInput {
  /** @minLength 1 */
  name: string;
  description?: string;
  color?: string;
  status?: ProjectInputStatus;
  dueDate?: string;
}

export type ProjectUpdateStatus = typeof ProjectUpdateStatus[keyof typeof ProjectUpdateStatus];


export const ProjectUpdateStatus = {
  planned: 'planned',
  active: 'active',
  blocked: 'blocked',
  completed: 'completed',
  archived: 'archived',
} as const;

export interface ProjectUpdate {
  /** @minLength 1 */
  name?: string;
  /** @nullable */
  description?: string | null;
  color?: string;
  status?: ProjectUpdateStatus;
  /** @nullable */
  dueDate?: string | null;
}

export interface ProjectProgress {
  id: number;
  name: string;
  color?: string;
  status?: string;
  /** @nullable */
  dueDate?: string | null;
  isOverdue?: boolean;
  completionPercentage: number;
  taskCount: number;
}

export interface ScheduledTask {
  task: Task;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface HourlyCompletions {
  hour: number;
  count: number;
}

export interface ProductivityStats {
  completionsByHour: HourlyCompletions[];
  mostProductiveHours: number[];
  totalCompletions: number;
  avgDailyCompletions: number;
  peakStartHour: number;
}

export interface BriefingStats {
  pendingCount: number;
  overdueCount: number;
  highPriorityCount: number;
  dueTodayCount: number;
  completedTodayCount: number;
}

export interface DailyBriefing {
  summary: string;
  todaysFocus: string;
  biggestRisk: string;
  recommendedAction: string;
  estimatedCompletion: number;
  generatedAt: string;
  stats: BriefingStats;
  blockedTaskCount?: number;
  projectsSummary?: ProjectProgress[];
  /** Projects that are overdue or blocked */
  atRiskProjects?: ProjectProgress[];
}

export interface InboxItem {
  id: number;
  title: string;
  /** @nullable */
  notes?: string | null;
  processed: boolean;
  /** @nullable */
  processedAt?: string | null;
  createdAt: string;
}

export interface InboxItemInput {
  /** @minLength 1 */
  title: string;
  notes?: string;
}

export interface InboxItemUpdate {
  /** @minLength 1 */
  title?: string;
  /** @nullable */
  notes?: string | null;
  processed?: boolean;
}

export interface InboxStats {
  total: number;
  unprocessed: number;
}

export type ProcessInboxItemInputTarget = typeof ProcessInboxItemInputTarget[keyof typeof ProcessInboxItemInputTarget];


export const ProcessInboxItemInputTarget = {
  task: 'task',
  project: 'project',
} as const;

export type ProcessInboxItemInputPriority = typeof ProcessInboxItemInputPriority[keyof typeof ProcessInboxItemInputPriority];


export const ProcessInboxItemInputPriority = {
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

export interface ProcessInboxItemInput {
  target: ProcessInboxItemInputTarget;
  workspaceId: number;
  projectId?: number;
  deadline?: string;
  priority?: ProcessInboxItemInputPriority;
}

export type ProcessInboxItemResultCreatedType = typeof ProcessInboxItemResultCreatedType[keyof typeof ProcessInboxItemResultCreatedType];


export const ProcessInboxItemResultCreatedType = {
  task: 'task',
  project: 'project',
} as const;

export interface ProcessInboxItemResult {
  item: InboxItem;
  createdType: ProcessInboxItemResultCreatedType;
  createdId: number;
}

export type ReminderKind = typeof ReminderKind[keyof typeof ReminderKind];


export const ReminderKind = {
  reminder: 'reminder',
  alarm: 'alarm',
} as const;

export type ReminderStatus = typeof ReminderStatus[keyof typeof ReminderStatus];


export const ReminderStatus = {
  active: 'active',
  snoozed: 'snoozed',
  dismissed: 'dismissed',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ReminderTargetType = typeof ReminderTargetType[keyof typeof ReminderTargetType];


export const ReminderTargetType = {
  task: 'task',
  project: 'project',
  event: 'event',
} as const;

export type ReminderRecurrence = typeof ReminderRecurrence[keyof typeof ReminderRecurrence];


export const ReminderRecurrence = {
  none: 'none',
  daily: 'daily',
  weekdays: 'weekdays',
  weekly: 'weekly',
  monthly: 'monthly',
} as const;

export type ReminderSource = typeof ReminderSource[keyof typeof ReminderSource];


export const ReminderSource = {
  user: 'user',
  ai: 'ai',
} as const;

export interface Reminder {
  id: number;
  title: string;
  /** @nullable */
  notes?: string | null;
  kind: ReminderKind;
  status: ReminderStatus;
  targetType: ReminderTargetType;
  /** @nullable */
  taskId?: number | null;
  /** @nullable */
  projectId?: number | null;
  triggerAt: string;
  recurrence: ReminderRecurrence;
  /** @nullable */
  snoozedUntil?: string | null;
  /** @nullable */
  lastTriggeredAt?: string | null;
  source: ReminderSource;
  /** @nullable */
  workspaceId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ReminderInputKind = typeof ReminderInputKind[keyof typeof ReminderInputKind];


export const ReminderInputKind = {
  reminder: 'reminder',
  alarm: 'alarm',
} as const;

export type ReminderInputTargetType = typeof ReminderInputTargetType[keyof typeof ReminderInputTargetType];


export const ReminderInputTargetType = {
  task: 'task',
  project: 'project',
  event: 'event',
} as const;

export type ReminderInputRecurrence = typeof ReminderInputRecurrence[keyof typeof ReminderInputRecurrence];


export const ReminderInputRecurrence = {
  none: 'none',
  daily: 'daily',
  weekdays: 'weekdays',
  weekly: 'weekly',
  monthly: 'monthly',
} as const;

export type ReminderInputSource = typeof ReminderInputSource[keyof typeof ReminderInputSource];


export const ReminderInputSource = {
  user: 'user',
  ai: 'ai',
} as const;

export interface ReminderInput {
  /** @minLength 1 */
  title: string;
  notes?: string;
  kind?: ReminderInputKind;
  targetType?: ReminderInputTargetType;
  taskId?: number;
  projectId?: number;
  triggerAt: string;
  recurrence?: ReminderInputRecurrence;
  source?: ReminderInputSource;
  workspaceId?: number;
}

export type ReminderUpdateKind = typeof ReminderUpdateKind[keyof typeof ReminderUpdateKind];


export const ReminderUpdateKind = {
  reminder: 'reminder',
  alarm: 'alarm',
} as const;

export type ReminderUpdateStatus = typeof ReminderUpdateStatus[keyof typeof ReminderUpdateStatus];


export const ReminderUpdateStatus = {
  active: 'active',
  snoozed: 'snoozed',
  dismissed: 'dismissed',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ReminderUpdateTargetType = typeof ReminderUpdateTargetType[keyof typeof ReminderUpdateTargetType];


export const ReminderUpdateTargetType = {
  task: 'task',
  project: 'project',
  event: 'event',
} as const;

export type ReminderUpdateRecurrence = typeof ReminderUpdateRecurrence[keyof typeof ReminderUpdateRecurrence];


export const ReminderUpdateRecurrence = {
  none: 'none',
  daily: 'daily',
  weekdays: 'weekdays',
  weekly: 'weekly',
  monthly: 'monthly',
} as const;

export type ReminderUpdateActor = typeof ReminderUpdateActor[keyof typeof ReminderUpdateActor];


export const ReminderUpdateActor = {
  user: 'user',
  ai: 'ai',
  system: 'system',
} as const;

export interface ReminderUpdate {
  /** @minLength 1 */
  title?: string;
  /** @nullable */
  notes?: string | null;
  kind?: ReminderUpdateKind;
  status?: ReminderUpdateStatus;
  targetType?: ReminderUpdateTargetType;
  /** @nullable */
  taskId?: number | null;
  /** @nullable */
  projectId?: number | null;
  triggerAt?: string;
  recurrence?: ReminderUpdateRecurrence;
  /** @nullable */
  workspaceId?: number | null;
  actor?: ReminderUpdateActor;
}

export type SnoozeReminderInputActor = typeof SnoozeReminderInputActor[keyof typeof SnoozeReminderInputActor];


export const SnoozeReminderInputActor = {
  user: 'user',
  ai: 'ai',
  system: 'system',
} as const;

export interface SnoozeReminderInput {
  /** @minimum 1 */
  minutes?: number;
  until?: string;
  actor?: SnoozeReminderInputActor;
}

export type ReminderActorInputActor = typeof ReminderActorInputActor[keyof typeof ReminderActorInputActor];


export const ReminderActorInputActor = {
  user: 'user',
  ai: 'ai',
  system: 'system',
} as const;

export interface ReminderActorInput {
  actor?: ReminderActorInputActor;
}

export type ReminderEventType = typeof ReminderEventType[keyof typeof ReminderEventType];


export const ReminderEventType = {
  created: 'created',
  updated: 'updated',
  triggered: 'triggered',
  snoozed: 'snoozed',
  dismissed: 'dismissed',
  completed: 'completed',
  cancelled: 'cancelled',
  rescheduled: 'rescheduled',
} as const;

export type ReminderEventActor = typeof ReminderEventActor[keyof typeof ReminderEventActor];


export const ReminderEventActor = {
  user: 'user',
  ai: 'ai',
  system: 'system',
} as const;

export interface ReminderEvent {
  id: number;
  reminderId: number;
  type: ReminderEventType;
  actor: ReminderEventActor;
  /** @nullable */
  detail?: string | null;
  createdAt: string;
}

export interface ReminderWithHistory {
  reminder: Reminder;
  history: ReminderEvent[];
}

export interface ReminderStats {
  total: number;
  active: number;
  due: number;
  snoozed: number;
}

export interface DayPlan {
  date: string;
  scheduledTasks: ScheduledTask[];
  unscheduledTasks: Task[];
  summary: string;
}

export type ListProjectsParams = {
status?: ListProjectsStatus;
};

export type ListProjectsStatus = typeof ListProjectsStatus[keyof typeof ListProjectsStatus];


export const ListProjectsStatus = {
  all: 'all',
  planned: 'planned',
  active: 'active',
  blocked: 'blocked',
  completed: 'completed',
  archived: 'archived',
} as const;

export type ListTasksParams = {
status?: ListTasksStatus;
projectId?: number;
};

export type ListTasksStatus = typeof ListTasksStatus[keyof typeof ListTasksStatus];


export const ListTasksStatus = {
  all: 'all',
  pending: 'pending',
  completed: 'completed',
} as const;

export type ListInboxItemsParams = {
status?: ListInboxItemsStatus;
};

export type ListInboxItemsStatus = typeof ListInboxItemsStatus[keyof typeof ListInboxItemsStatus];


export const ListInboxItemsStatus = {
  all: 'all',
  unprocessed: 'unprocessed',
  processed: 'processed',
} as const;

export type ListRemindersParams = {
status?: ListRemindersStatus;
kind?: ListRemindersKind;
targetType?: ListRemindersTargetType;
};

export type ListRemindersStatus = typeof ListRemindersStatus[keyof typeof ListRemindersStatus];


export const ListRemindersStatus = {
  all: 'all',
  active: 'active',
  snoozed: 'snoozed',
  dismissed: 'dismissed',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ListRemindersKind = typeof ListRemindersKind[keyof typeof ListRemindersKind];


export const ListRemindersKind = {
  all: 'all',
  reminder: 'reminder',
  alarm: 'alarm',
} as const;

export type ListRemindersTargetType = typeof ListRemindersTargetType[keyof typeof ListRemindersTargetType];


export const ListRemindersTargetType = {
  all: 'all',
  task: 'task',
  project: 'project',
  event: 'event',
} as const;

