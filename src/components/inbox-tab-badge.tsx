import React from "react";
import { useGetInboxStats } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function InboxTabBadge({ className }: { className?: string }) {
  const { data } = useGetInboxStats();
  const count = data?.unprocessed ?? 0;
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
