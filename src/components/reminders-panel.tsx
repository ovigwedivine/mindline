import React, { useState } from "react";
import type { Reminder, ReminderEvent } from "@workspace/api-client-react";
import {
  useListReminders,
  useDeleteReminder,
  useSnoozeReminder,
  useDismissReminder,
  useCompleteReminder,
  useGetReminderHistory,
  getListRemindersQueryKey,
  getListDueRemindersQueryKey,
  getGetReminderStatsQueryKey,
  getGetReminderHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { ReminderFormDialog } from "@/components/reminder-form-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  AlarmClock,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  Repeat,
  History,
  Pencil,
  CalendarClock,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const RECURRENCE_LABEL: Record<string, string> = {
  none: "",
  daily: "Daily",
  weekdays: "Weekdays",
  weekly: "Weekly",
  monthly: "Monthly",
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time}`;
}

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const suffix = diff >= 0 ? "from now" : "ago";
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ${suffix}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ${suffix}`;
  const days = Math.round(hrs / 24);
  return `${days}d ${suffix}`;
}

export function RemindersPanel() {
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  const { data: reminders, isLoading } = useListReminders(undefined, {
    query: { queryKey: getListRemindersQueryKey(), refetchInterval: 30_000 },
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Reminder | null>(null);

  function openCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }
  function openEdit(r: Reminder) {
    setEditTarget(r);
    setFormOpen(true);
  }

  const all = reminders ?? [];
  const now = Date.now();
  // A snoozed reminder's effective next-fire time is snoozedUntil, not triggerAt.
  const effectiveTime = (r: Reminder) =>
    r.status === "snoozed" && r.snoozedUntil ? r.snoozedUntil : r.triggerAt;
  const isDue = (r: Reminder) =>
    (r.status === "active" && new Date(r.triggerAt).getTime() <= now) ||
    (r.status === "snoozed" && r.snoozedUntil != null && new Date(r.snoozedUntil).getTime() <= now);

  const due = all.filter(isDue);
  const upcoming = all
    .filter((r) => (r.status === "active" || r.status === "snoozed") && !isDue(r))
    .sort((a, b) => new Date(effectiveTime(a)).getTime() - new Date(effectiveTime(b)).getTime());
  const past = all
    .filter((r) => r.status === "dismissed" || r.status === "completed")
    .slice(0, 8);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className={cn("text-sm font-semibold", technical && "font-mono uppercase tracking-wider")}>
            {technical ? "REMINDERS" : "Reminders"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {due.length > 0 && `${due.length} due · `}
            {upcoming.length} upcoming
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={openCreate} className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> New
        </Button>
      </div>

      {/* Due now */}
      {due.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className={cn("text-xs font-medium text-destructive", technical && "font-mono uppercase tracking-wider")}>
            Due now
          </h3>
          {due.map((r) => (
            <ReminderRow key={r.id} reminder={r} technical={technical} due onEdit={openEdit} />
          ))}
        </div>
      )}

      {/* Upcoming */}
      <div className="flex flex-col gap-2">
        {upcoming.length === 0 && due.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
            <Bell className="h-8 w-8 text-primary/60" />
            <div>
              <p className="text-sm font-medium text-foreground">No reminders yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Set a reminder or alarm so nothing slips through.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openCreate} className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> New reminder
            </Button>
          </div>
        ) : (
          upcoming.map((r) => (
            <ReminderRow key={r.id} reminder={r} technical={technical} onEdit={openEdit} />
          ))
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className={cn("text-xs text-muted-foreground", technical && "font-mono uppercase tracking-wider")}>
            Recently completed
          </h3>
          {past.map((r) => (
            <div
              key={r.id}
              className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              {r.status === "completed" ? (
                <Check className="h-4 w-4 text-primary/60 shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              )}
              <span className="flex-1 min-w-0 truncate text-sm text-muted-foreground line-through">
                {r.title}
              </span>
              <span className="text-[11px] text-muted-foreground/60 shrink-0 capitalize">
                {r.status}
              </span>
              <DeleteButton id={r.id} />
            </div>
          ))}
        </div>
      )}

      <ReminderFormDialog reminder={editTarget} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}

function ReminderRow({
  reminder: r,
  technical,
  due,
  onEdit,
}: {
  reminder: Reminder;
  technical: boolean;
  due?: boolean;
  onEdit: (r: Reminder) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListDueRemindersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetReminderStatsQueryKey() });
  }

  const onErr = (err: unknown) =>
    toast({
      title: "Action failed",
      description: (err as any)?.message || "An error occurred",
      variant: "destructive",
    });

  const snooze = useSnoozeReminder({ mutation: { onSuccess: invalidate, onError: onErr } });
  const dismiss = useDismissReminder({ mutation: { onSuccess: invalidate, onError: onErr } });
  const complete = useCompleteReminder({ mutation: { onSuccess: invalidate, onError: onErr } });

  const isAlarm = r.kind === "alarm";
  const recurrenceLabel = RECURRENCE_LABEL[r.recurrence] || "";
  const Icon = isAlarm ? AlarmClock : Bell;
  // Snoozed reminders fire at snoozedUntil, so show that as the effective time.
  const whenIso = r.status === "snoozed" && r.snoozedUntil ? r.snoozedUntil : r.triggerAt;

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        due && isAlarm
          ? "border-destructive/60 bg-destructive/5"
          : due
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-primary/40",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 mt-0.5 shrink-0",
          isAlarm ? "text-destructive" : "text-primary",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("text-sm font-medium text-foreground", technical && "font-mono")}>
            {r.title}
          </p>
          {isAlarm && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Alarm
            </span>
          )}
          {r.source === "ai" && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Bot className="h-3 w-3" /> AI
            </span>
          )}
        </div>
        {r.notes && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">
            {r.notes}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground/80">
          <span className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" /> {formatWhen(whenIso)}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {relativeTime(whenIso)}
          </span>
          {recurrenceLabel && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="flex items-center gap-1">
                <Repeat className="h-3 w-3" /> {recurrenceLabel}
              </span>
            </>
          )}
          {r.status === "snoozed" && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-amber-500">snoozed</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {due && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={snooze.isPending}
              >
                Snooze
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="end">
              <div className="flex flex-col">
                {[
                  { label: "5 minutes", min: 5 },
                  { label: "15 minutes", min: 15 },
                  { label: "1 hour", min: 60 },
                  { label: "Tomorrow", min: 60 * 24 },
                ].map((opt) => (
                  <button
                    key={opt.min}
                    onClick={() => snooze.mutate({ id: r.id, data: { minutes: opt.min } })}
                    className="text-left text-xs px-2 py-1.5 rounded-sm hover:bg-muted transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => complete.mutate({ id: r.id, data: {} })}
          disabled={complete.isPending}
          className="h-7 w-7 text-muted-foreground/60 hover:text-primary"
          aria-label="Complete reminder"
          title="Mark done"
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => dismiss.mutate({ id: r.id, data: {} })}
          disabled={dismiss.isPending}
          className="h-7 w-7 text-muted-foreground/60 hover:text-foreground"
          aria-label="Dismiss reminder"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <HistoryButton id={r.id} />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(r)}
          className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
          aria-label="Edit reminder"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <DeleteButton id={r.id} />
      </div>
    </div>
  );
}

function HistoryButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetReminderHistory(id, {
    query: { enabled: open, queryKey: getGetReminderHistoryQueryKey(id) },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground/50 hover:text-foreground"
          aria-label="Reminder history"
          title="History"
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end">
        <p className="text-xs font-medium text-foreground mb-2 px-1">History</p>
        {isLoading ? (
          <div className="flex flex-col gap-1.5 px-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground px-1">No events yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {(data ?? []).map((ev: ReminderEvent) => (
              <div key={ev.id} className="flex items-start gap-2 px-1">
                <span
                  className={cn(
                    "mt-1 h-1.5 w-1.5 rounded-full shrink-0",
                    ev.actor === "ai" ? "bg-violet-400" : ev.actor === "system" ? "bg-muted-foreground/40" : "bg-primary",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground capitalize">
                    {ev.type}
                    <span className="text-muted-foreground/60 ml-1 lowercase">· {ev.actor}</span>
                  </p>
                  {ev.detail && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{ev.detail}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/50">
                    {new Date(ev.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DeleteButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const del = useDeleteReminder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListDueRemindersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReminderStatsQueryKey() });
      },
      onError: (err) =>
        toast({
          title: "Couldn't delete",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        }),
    },
  });
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => del.mutate({ id })}
      disabled={del.isPending}
      className="h-7 w-7 text-muted-foreground/50 hover:text-destructive transition-colors"
      aria-label="Delete reminder"
      title="Delete"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
