import React, { useState } from "react";
import type { InboxItem } from "@workspace/api-client-react";
import {
  useListInboxItems,
  useDeleteInboxItem,
  getListInboxItemsQueryKey,
  getGetInboxStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { useQuickCapture } from "@/components/quick-capture";
import { ProcessInboxDialog } from "@/components/process-inbox-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox, Trash2, ArrowRight, Plus, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export function InboxPanel() {
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";
  const { open: openCapture } = useQuickCapture();

  const { data: items, isLoading } = useListInboxItems({ status: "all" });

  const [processTarget, setProcessTarget] = useState<InboxItem | null>(null);
  const [processOpen, setProcessOpen] = useState(false);

  const unprocessed = (items ?? []).filter((i) => !i.processed);
  const processed = (items ?? []).filter((i) => i.processed).slice(0, 8);

  function startProcess(item: InboxItem) {
    setProcessTarget(item);
    setProcessOpen(true);
  }

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
      {/* Header / counts */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          <h2 className={cn("text-sm font-semibold", technical && "font-mono uppercase tracking-wider")}>
            {technical ? "INBOX" : "Inbox"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {unprocessed.length} unprocessed · {items?.length ?? 0} total
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={openCapture} className="h-7 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1" /> Capture
        </Button>
      </div>

      {/* Unprocessed */}
      <div className="flex flex-col gap-2">
        {unprocessed.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary/60" />
            <div>
              <p className="text-sm font-medium text-foreground">Inbox zero</p>
              <p className="text-xs text-muted-foreground mt-1">
                Nothing to process. Capture a thought anytime — press{" "}
                <span className="font-mono">C</span>.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openCapture} className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Quick capture
            </Button>
          </div>
        ) : (
          unprocessed.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40",
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium text-foreground", technical && "font-mono")}>
                  {item.title}
                </p>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-wrap">
                    {item.notes}
                  </p>
                )}
                <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <Clock className="h-3 w-3" /> {relativeTime(item.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  onClick={() => startProcess(item)}
                  className="h-7 text-xs"
                >
                  Process <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
                <DeleteInboxButton id={item.id} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recently processed */}
      {processed.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className={cn("text-xs text-muted-foreground", technical && "font-mono uppercase tracking-wider")}>
            Recently processed
          </h3>
          {processed.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
            >
              <CheckCircle2 className="h-4 w-4 text-primary/60 shrink-0" />
              <span className="flex-1 min-w-0 truncate text-sm text-muted-foreground line-through">
                {item.title}
              </span>
              <span className="text-[11px] text-muted-foreground/60 shrink-0">
                {item.processedAt ? relativeTime(item.processedAt) : ""}
              </span>
              <DeleteInboxButton id={item.id} />
            </div>
          ))}
        </div>
      )}

      <ProcessInboxDialog item={processTarget} open={processOpen} onOpenChange={setProcessOpen} />
    </div>
  );
}

function DeleteInboxButton({ id }: { id: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteItem = useDeleteInboxItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInboxItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInboxStatsQueryKey() });
      },
      onError: (err) => {
        toast({
          title: "Couldn't delete",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => deleteItem.mutate({ id })}
      disabled={deleteItem.isPending}
      className="h-7 w-7 text-muted-foreground/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive transition-opacity"
      aria-label="Delete inbox item"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
