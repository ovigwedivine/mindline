import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Reminder } from "@workspace/api-client-react";
import {
  useListDueReminders,
  useSnoozeReminder,
  useDismissReminder,
  useCompleteReminder,
  getListRemindersQueryKey,
  getListDueRemindersQueryKey,
  getGetReminderStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, AlarmClock, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const POLL_INTERVAL = 30_000;

interface NotificationContextValue {
  dueCount: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}

// --- Sound: synthesized via Web Audio, no asset needed ---
let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

function playChime(alarm: boolean) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  // Alarms: three urgent beeps; reminders: a single soft tone.
  const notes = alarm ? [880, 880, 880] : [660];
  const gap = alarm ? 0.18 : 0;
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const start = ctx.currentTime + i * gap;
    const dur = alarm ? 0.12 : 0.4;
    osc.type = alarm ? "square" : "sine";
    osc.frequency.value = freq;
    const peak = alarm ? 0.18 : 0.1;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  });
}

function showBrowserNotification(r: Reminder) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(r.kind === "alarm" ? `⏰ ${r.title}` : r.title, {
      body: r.notes || (r.kind === "alarm" ? "Alarm" : "Reminder"),
      tag: `reminder-${r.id}`,
    });
  } catch {
    /* ignore */
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: due } = useListDueReminders({
    query: {
      queryKey: getListDueRemindersQueryKey(),
      refetchInterval: POLL_INTERVAL,
      refetchOnWindowFocus: true,
    },
  });

  const dueList = due ?? [];
  const dueCount = dueList.length;

  const { toast } = useToast();
  // Track which reminders we've already alerted this session (by trigger instant)
  // so recurring reminders re-alert on their next occurrence.
  const alerted = useRef<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);

  // Ask for browser notification permission once, lazily.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    for (const r of dueList) {
      const key = `${r.id}:${r.snoozedUntil ?? r.triggerAt}`;
      if (alerted.current.has(key)) continue;
      alerted.current.add(key);
      const isAlarm = r.kind === "alarm";
      playChime(isAlarm);
      showBrowserNotification(r);
      toast({
        title: isAlarm ? `⏰ ${r.title}` : r.title,
        description: r.notes || (isAlarm ? "Alarm" : "Reminder"),
        variant: isAlarm ? "destructive" : "default",
      });
    }
    // Prune keys for reminders no longer due to bound memory.
    if (alerted.current.size > 200) {
      const live = new Set(dueList.map((r) => `${r.id}:${r.snoozedUntil ?? r.triggerAt}`));
      for (const k of alerted.current) if (!live.has(k)) alerted.current.delete(k);
    }
  }, [dueList, toast]);

  return (
    <NotificationContext.Provider value={{ dueCount }}>
      {children}
      <NotificationBell
        dueList={dueList}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </NotificationContext.Provider>
  );
}

function NotificationBell({
  dueList,
  open,
  onOpenChange,
}: {
  dueList: Reminder[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const dueCount = dueList.length;
  const hasAlarm = dueList.some((r) => r.kind === "alarm");

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Notifications${dueCount ? ` (${dueCount} due)` : ""}`}
            title="Notifications"
            className={cn(
              "relative flex h-12 w-12 items-center justify-center rounded-full border shadow-xl transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              dueCount > 0
                ? hasAlarm
                  ? "bg-destructive text-destructive-foreground border-destructive focus-visible:ring-destructive"
                  : "bg-primary text-primary-foreground border-primary focus-visible:ring-primary"
                : "bg-card text-muted-foreground border-border focus-visible:ring-primary",
            )}
          >
            <Bell className={cn("h-5 w-5", dueCount > 0 && hasAlarm && "animate-pulse")} />
            {dueCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 text-[10px] font-semibold leading-none text-foreground ring-2 ring-background">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-80 p-0">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            <span className="text-xs text-muted-foreground">{dueCount} due</span>
          </div>
          {dueCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Check className="h-6 w-6 text-primary/60" />
              <p className="text-xs text-muted-foreground">You're all caught up.</p>
            </div>
          ) : (
            <div className="flex flex-col max-h-96 overflow-y-auto divide-y divide-border">
              {dueList.map((r) => (
                <DueNotificationRow key={r.id} reminder={r} />
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DueNotificationRow({ reminder: r }: { reminder: Reminder }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListDueRemindersQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetReminderStatsQueryKey() });
  }
  const onErr = useCallback(
    (err: unknown) =>
      toast({
        title: "Action failed",
        description: (err as any)?.message || "An error occurred",
        variant: "destructive",
      }),
    [toast],
  );

  const snooze = useSnoozeReminder({ mutation: { onSuccess: invalidate, onError: onErr } });
  const dismiss = useDismissReminder({ mutation: { onSuccess: invalidate, onError: onErr } });
  const complete = useCompleteReminder({ mutation: { onSuccess: invalidate, onError: onErr } });

  const isAlarm = r.kind === "alarm";
  const Icon = isAlarm ? AlarmClock : Bell;

  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", isAlarm ? "text-destructive" : "text-primary")} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
        {r.notes && <p className="text-xs text-muted-foreground line-clamp-2">{r.notes}</p>}
        <div className="mt-1.5 flex items-center gap-1">
          <button
            onClick={() => complete.mutate({ id: r.id, data: {} })}
            disabled={complete.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] text-primary hover:bg-primary/20 transition-colors"
          >
            <Check className="h-3 w-3" /> Done
          </button>
          <button
            onClick={() => snooze.mutate({ id: r.id, data: { minutes: 15 } })}
            disabled={snooze.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock className="h-3 w-3" /> 15m
          </button>
          <button
            onClick={() => dismiss.mutate({ id: r.id, data: {} })}
            disabled={dismiss.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" /> Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
