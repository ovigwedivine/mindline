import React from "react";
import {
  useGetReminderStats,
  getGetReminderStatsQueryKey,
} from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function ReminderTabBadge({ className }: { className?: string }) {
  const { data } = useGetReminderStats({
    query: { queryKey: getGetReminderStatsQueryKey(), refetchInterval: 30_000 },
  });
  const count = data?.due ?? 0;
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
