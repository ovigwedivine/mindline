import React, { useEffect, useState } from "react";
import type { Reminder } from "@workspace/api-client-react";
import {
  useCreateReminder,
  useUpdateReminder,
  useListTasks,
  useListProjects,
  getListRemindersQueryKey,
  getListDueRemindersQueryKey,
  getGetReminderStatsQueryKey,
  getListTasksQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, AlarmClock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "reminder" | "alarm";
type TargetType = "event" | "task" | "project";
type Recurrence = "none" | "daily" | "weekdays" | "weekly" | "monthly";

// Convert an ISO string to the value a datetime-local input expects (local time).
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultTrigger(): string {
  // Default to one hour from now, rounded to the next 5 minutes.
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5, 0, 0);
  return isoToLocalInput(d.toISOString());
}

export function ReminderFormDialog({
  reminder,
  open,
  onOpenChange,
}: {
  reminder?: Reminder | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const editing = !!reminder;

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<Kind>("reminder");
  const [targetType, setTargetType] = useState<TargetType>("event");
  const [targetId, setTargetId] = useState<string>("none");
  const [triggerLocal, setTriggerLocal] = useState<string>(defaultTrigger());
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  const { data: tasks } = useListTasks(undefined, {
    query: { queryKey: getListTasksQueryKey(), enabled: open && targetType === "task" },
  });
  const { data: projects } = useListProjects(undefined, {
    query: { queryKey: getListProjectsQueryKey(), enabled: open && targetType === "project" },
  });

  useEffect(() => {
    if (!open) return;
    if (reminder) {
      setTitle(reminder.title);
      setNotes(reminder.notes ?? "");
      setKind(reminder.kind as Kind);
      setTargetType(reminder.targetType as TargetType);
      setTargetId(
        reminder.targetType === "task" && reminder.taskId
          ? String(reminder.taskId)
          : reminder.targetType === "project" && reminder.projectId
            ? String(reminder.projectId)
            : "none",
      );
      setTriggerLocal(isoToLocalInput(reminder.triggerAt));
      setRecurrence(reminder.recurrence as Recurrence);
    } else {
      setTitle("");
      setNotes("");
      setKind("reminder");
      setTargetType("event");
      setTargetId("none");
      setTriggerLocal(defaultTrigger());
      setRecurrence("none");
    }
  }, [open, reminder]);

  // Reset the linked item whenever the target type changes.
  useEffect(() => {
    if (!editing) setTargetId("none");
  }, [targetType, editing]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListDueRemindersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetReminderStatsQueryKey() });
  }

  const createReminder = useCreateReminder({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: kind === "alarm" ? "Alarm set" : "Reminder set" });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({
          title: "Couldn't save",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  const updateReminder = useUpdateReminder({
    mutation: {
      onSuccess: () => {
        invalidate();
        toast({ title: "Reminder updated" });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({
          title: "Couldn't update",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  const isPending = createReminder.isPending || updateReminder.isPending;

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      toast({ title: "Add a title", variant: "destructive" });
      return;
    }
    if (!triggerLocal) {
      toast({ title: "Pick a date and time", variant: "destructive" });
      return;
    }
    const triggerAt = new Date(triggerLocal);
    if (Number.isNaN(triggerAt.getTime())) {
      toast({ title: "Invalid date and time", variant: "destructive" });
      return;
    }

    const taskId =
      targetType === "task" && targetId !== "none" ? Number(targetId) : undefined;
    const projectId =
      targetType === "project" && targetId !== "none" ? Number(targetId) : undefined;

    if (editing && reminder) {
      updateReminder.mutate({
        id: reminder.id,
        data: {
          title: trimmed,
          notes: notes.trim() || null,
          kind,
          targetType,
          taskId: taskId ?? null,
          projectId: projectId ?? null,
          triggerAt: triggerAt.toISOString(),
          recurrence,
        },
      });
    } else {
      createReminder.mutate({
        data: {
          title: trimmed,
          notes: notes.trim() || undefined,
          kind,
          targetType,
          taskId,
          projectId,
          triggerAt: triggerAt.toISOString(),
          recurrence,
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {kind === "alarm" ? (
              <AlarmClock className="h-4 w-4 text-destructive" />
            ) : (
              <Bell className="h-4 w-4 text-primary" />
            )}
            {editing ? "Edit reminder" : "New reminder"}
          </DialogTitle>
          <DialogDescription>
            Get notified at the right time. Alarms are higher priority and stand out.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Kind selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("reminder")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
                kind === "reminder"
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <Bell className="h-4 w-4" /> Reminder
            </button>
            <button
              type="button"
              onClick={() => setKind("alarm")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
                kind === "alarm"
                  ? "border-destructive bg-destructive/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <AlarmClock className="h-4 w-4" /> Alarm
            </button>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should we remind you about?"
              aria-label="Reminder title"
              autoComplete="off"
            />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any details…"
              aria-label="Reminder notes (optional)"
              rows={2}
              className="resize-none"
            />
          </div>

          {/* When */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">When</Label>
            <Input
              type="datetime-local"
              value={triggerLocal}
              onChange={(e) => setTriggerLocal(e.target.value)}
              aria-label="Reminder date and time"
            />
          </div>

          {/* Repeat */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Repeat</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
              <SelectTrigger aria-label="Repeat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekdays">Every weekday</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attach to */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Attach to</Label>
            <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
              <SelectTrigger aria-label="Attach to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Standalone event</SelectItem>
                <SelectItem value="task">A task</SelectItem>
                <SelectItem value="project">A project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === "task" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Task</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger aria-label="Task">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific task</SelectItem>
                  {(tasks ?? []).map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "project" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Project</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger aria-label="Project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific project</SelectItem>
                  {(projects ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? "Save changes" : kind === "alarm" ? "Set alarm" : "Set reminder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
