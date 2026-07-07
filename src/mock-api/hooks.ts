/**
 * Mindline Showcase — mock React Query hooks.
 *
 * Drop-in replacements for the Orval-generated hooks the real Mindline app
 * uses (`@workspace/api-client-react`). Same call signatures, same query-key
 * shapes — backed by the in-memory demo store instead of an HTTP API.
 */
import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";
import * as store from "./store";
import type {
  DailyBriefing,
  DayPlan,
  InboxItem,
  InboxItemInput,
  InboxItemUpdate,
  InboxStats,
  ListInboxItemsParams,
  ListProjectsParams,
  ListRemindersParams,
  ListTasksParams,
  ProcessInboxItemInput,
  ProcessInboxItemResult,
  ProductivityStats,
  Project,
  ProjectInput,
  ProjectUpdate,
  Reminder,
  ReminderActorInput,
  ReminderEvent,
  ReminderInput,
  ReminderStats,
  ReminderUpdate,
  SnoozeReminderInput,
  Task,
  TaskCompleteInput,
  TaskDependencyInput,
  TaskInput,
  TaskStats,
  TaskUpdate,
  Workspace,
  WorkspaceInput,
} from "./types";

// Simulated network latency so loading states are visible in the demo.
const LATENCY_MS = 200;
const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

// Orval-style option bags. `request` is accepted (the real client uses it for
// per-request headers) but ignored by the mock layer.
interface QueryHookOptions<TData> {
  query?: Partial<UseQueryOptions<TData, Error, TData, QueryKey>>;
  request?: unknown;
}

interface MutationHookOptions<TData, TVariables> {
  mutation?: UseMutationOptions<TData, Error, TVariables, unknown>;
  request?: unknown;
}

function useMockQuery<TData>(
  defaultKey: QueryKey,
  fetcher: () => TData,
  options?: QueryHookOptions<TData>,
): UseQueryResult<TData, Error> {
  const merged = {
    queryKey: defaultKey,
    queryFn: async () => {
      await delay();
      return fetcher();
    },
    ...options?.query,
  } as UseQueryOptions<TData, Error, TData, QueryKey>;
  return useQuery<TData, Error, TData, QueryKey>(merged);
}

function useMockMutation<TData, TVariables>(
  fn: (variables: TVariables) => TData,
  options?: MutationHookOptions<TData, TVariables>,
): UseMutationResult<TData, Error, TVariables, unknown> {
  return useMutation<TData, Error, TVariables, unknown>({
    mutationFn: async (variables: TVariables) => {
      await delay();
      return fn(variables);
    },
    ...options?.mutation,
  });
}

const key = (path: string, params?: unknown): QueryKey =>
  params === undefined ? [path] : [path, params];

// The real client supports a per-request workspace override via an
// `x-workspace-id` header. Mirror that behavior here so components relying
// on it (e.g. the inbox process dialog) work identically against the mock.
function workspaceOverride(request: unknown): number | undefined {
  if (!request || typeof request !== "object") return undefined;
  const headers = (request as { headers?: Record<string, unknown> }).headers;
  if (!headers || typeof headers !== "object") return undefined;
  const raw =
    headers["x-workspace-id"] ?? headers["X-Workspace-ID"] ?? headers["X-Workspace-Id"];
  const n = Number(raw);
  return raw != null && Number.isFinite(n) && n > 0 ? n : undefined;
}

// ---------------------------------------------------------------------------
// Workspaces
// ---------------------------------------------------------------------------

export const getListWorkspacesQueryKey = (): QueryKey => ["/api/workspaces"];

export const useListWorkspaces = (options?: QueryHookOptions<Workspace[]>) =>
  useMockQuery(getListWorkspacesQueryKey(), () => store.listWorkspaces(), options);

export const useCreateWorkspace = (
  options?: MutationHookOptions<Workspace, { data: WorkspaceInput }>,
) => useMockMutation(({ data }) => store.createWorkspace(data), options);

export const useUpdateWorkspace = (
  options?: MutationHookOptions<Workspace, { id: number; data: WorkspaceInput }>,
) => useMockMutation(({ id, data }) => store.updateWorkspace(id, data), options);

export const useDeleteWorkspace = (
  options?: MutationHookOptions<void, { id: number }>,
) => useMockMutation(({ id }) => store.deleteWorkspace(id), options);

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const getListProjectsQueryKey = (params?: ListProjectsParams): QueryKey =>
  key("/api/projects", params);

export const useListProjects = (
  params?: ListProjectsParams,
  options?: QueryHookOptions<Project[]>,
) =>
  useMockQuery(
    getListProjectsQueryKey(params),
    () => store.listProjects(params?.status, workspaceOverride(options?.request)),
    options,
  );

export const useCreateProject = (
  options?: MutationHookOptions<Project, { data: ProjectInput }>,
) => useMockMutation(({ data }) => store.createProject(data), options);

export const useUpdateProject = (
  options?: MutationHookOptions<Project, { id: number; data: ProjectUpdate }>,
) => useMockMutation(({ id, data }) => store.updateProject(id, data), options);

export const useDeleteProject = (
  options?: MutationHookOptions<void, { id: number }>,
) => useMockMutation(({ id }) => store.deleteProject(id), options);

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const getListTasksQueryKey = (params?: ListTasksParams): QueryKey =>
  key("/api/tasks", params);

export const useListTasks = (
  params?: ListTasksParams,
  options?: QueryHookOptions<Task[]>,
) =>
  useMockQuery(
    getListTasksQueryKey(params),
    () => store.listTasks(params, workspaceOverride(options?.request)),
    options,
  );

export const getGetTaskStatsQueryKey = (): QueryKey => ["/api/tasks/stats"];

export const useGetTaskStats = (options?: QueryHookOptions<TaskStats>) =>
  useMockQuery(getGetTaskStatsQueryKey(), () => store.getTaskStats(), options);

export const useCreateTask = (
  options?: MutationHookOptions<Task, { data: TaskInput }>,
) => useMockMutation(({ data }) => store.createTask(data), options);

export const useUpdateTask = (
  options?: MutationHookOptions<Task, { id: number; data: TaskUpdate }>,
) => useMockMutation(({ id, data }) => store.updateTask(id, data), options);

export const useDeleteTask = (
  options?: MutationHookOptions<void, { id: number }>,
) => useMockMutation(({ id }) => store.deleteTask(id), options);

export const useCompleteTask = (
  options?: MutationHookOptions<Task, { id: number; data: TaskCompleteInput }>,
) => useMockMutation(({ id, data }) => store.completeTask(id, data.completed), options);

export const useAddTaskDependency = (
  options?: MutationHookOptions<Task, { id: number; data: TaskDependencyInput }>,
) => useMockMutation(({ id, data }) => store.addTaskDependency(id, data.dependsOnTaskId), options);

export const useRemoveTaskDependency = (
  options?: MutationHookOptions<void, { id: number; dependsOnId: number }>,
) => useMockMutation(({ id, dependsOnId }) => store.removeTaskDependency(id, dependsOnId), options);

// ---------------------------------------------------------------------------
// Analytics, briefing, planning (simulated AI)
// ---------------------------------------------------------------------------

export const getGetProductivityStatsQueryKey = (): QueryKey => ["/api/analytics/productivity"];

export const useGetProductivityStats = (options?: QueryHookOptions<ProductivityStats>) =>
  useMockQuery(getGetProductivityStatsQueryKey(), () => store.getProductivityStats(), options);

export const getGetDailyBriefingQueryKey = (): QueryKey => ["/api/briefing/daily"];

export const useGetDailyBriefing = (options?: QueryHookOptions<DailyBriefing>) =>
  useMockQuery(getGetDailyBriefingQueryKey(), () => store.getDailyBriefing(), options);

export const usePlanDay = (
  options?: MutationHookOptions<DayPlan, void>,
) => useMockMutation(() => store.planDay(), options);

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

export const getListInboxItemsQueryKey = (params?: ListInboxItemsParams): QueryKey =>
  key("/api/inbox", params);

export const useListInboxItems = (
  params?: ListInboxItemsParams,
  options?: QueryHookOptions<InboxItem[]>,
) => useMockQuery(getListInboxItemsQueryKey(params), () => store.listInboxItems(params?.status), options);

export const getGetInboxStatsQueryKey = (): QueryKey => ["/api/inbox/stats"];

export const useGetInboxStats = (options?: QueryHookOptions<InboxStats>) =>
  useMockQuery(getGetInboxStatsQueryKey(), () => store.getInboxStats(), options);

export const useCreateInboxItem = (
  options?: MutationHookOptions<InboxItem, { data: InboxItemInput }>,
) => useMockMutation(({ data }) => store.createInboxItem(data), options);

export const useUpdateInboxItem = (
  options?: MutationHookOptions<InboxItem, { id: number; data: InboxItemUpdate }>,
) => useMockMutation(({ id, data }) => store.updateInboxItem(id, data), options);

export const useDeleteInboxItem = (
  options?: MutationHookOptions<void, { id: number }>,
) => useMockMutation(({ id }) => store.deleteInboxItem(id), options);

export const useProcessInboxItem = (
  options?: MutationHookOptions<ProcessInboxItemResult, { id: number; data: ProcessInboxItemInput }>,
) => useMockMutation(({ id, data }) => store.processInboxItem(id, data), options);

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export const getListRemindersQueryKey = (params?: ListRemindersParams): QueryKey =>
  key("/api/reminders", params);

export const useListReminders = (
  params?: ListRemindersParams,
  options?: QueryHookOptions<Reminder[]>,
) => useMockQuery(getListRemindersQueryKey(params), () => store.listReminders(params), options);

export const getListDueRemindersQueryKey = (): QueryKey => ["/api/reminders/due"];

export const useListDueReminders = (options?: QueryHookOptions<Reminder[]>) =>
  useMockQuery(getListDueRemindersQueryKey(), () => store.listDueReminders(), options);

export const getGetReminderStatsQueryKey = (): QueryKey => ["/api/reminders/stats"];

export const useGetReminderStats = (options?: QueryHookOptions<ReminderStats>) =>
  useMockQuery(getGetReminderStatsQueryKey(), () => store.getReminderStats(), options);

export const getGetReminderHistoryQueryKey = (id: number): QueryKey => [
  `/api/reminders/${id}/history`,
];

export const useGetReminderHistory = (
  id: number,
  options?: QueryHookOptions<ReminderEvent[]>,
) => useMockQuery(getGetReminderHistoryQueryKey(id), () => store.getReminderHistory(id), options);

export const useCreateReminder = (
  options?: MutationHookOptions<Reminder, { data: ReminderInput }>,
) => useMockMutation(({ data }) => store.createReminder(data), options);

export const useUpdateReminder = (
  options?: MutationHookOptions<Reminder, { id: number; data: ReminderUpdate }>,
) => useMockMutation(({ id, data }) => store.updateReminder(id, data), options);

export const useDeleteReminder = (
  options?: MutationHookOptions<void, { id: number }>,
) => useMockMutation(({ id }) => store.deleteReminder(id), options);

export const useSnoozeReminder = (
  options?: MutationHookOptions<Reminder, { id: number; data: SnoozeReminderInput }>,
) => useMockMutation(({ id, data }) => store.snoozeReminder(id, data), options);

export const useDismissReminder = (
  options?: MutationHookOptions<Reminder, { id: number; data?: ReminderActorInput }>,
) => useMockMutation(({ id, data }) => store.dismissReminder(id, data?.actor), options);

export const useCompleteReminder = (
  options?: MutationHookOptions<Reminder, { id: number; data?: ReminderActorInput }>,
) => useMockMutation(({ id, data }) => store.completeReminder(id, data?.actor), options);
