import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  useCreateInboxItem,
  getListInboxItemsQueryKey,
  getGetInboxStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Inbox, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickCaptureContextValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const QuickCaptureContext = createContext<QuickCaptureContextValue | null>(null);

export function useQuickCapture() {
  const ctx = useContext(QuickCaptureContext);
  if (!ctx) throw new Error("useQuickCapture must be used within QuickCaptureProvider");
  return ctx;
}

export function QuickCaptureProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const editable =
        target?.isContentEditable ||
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";
      if (editable) return;
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <QuickCaptureContext.Provider value={{ open, close, isOpen }}>
      {children}
      <QuickCaptureFab onClick={open} />
      <QuickCaptureDialog open={isOpen} onOpenChange={setIsOpen} />
    </QuickCaptureContext.Provider>
  );
}

function QuickCaptureFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Quick capture to inbox"
      title="Quick capture (press C)"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/30 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}

function QuickCaptureDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { styleProfile } = useTheme();
  const technical = styleProfile === "technical";

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [savedCount, setSavedCount] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);

  const createItem = useCreateInboxItem({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInboxItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInboxStatsQueryKey() });
        setTitle("");
        setNotes("");
        setSavedCount((c) => c + 1);
        titleRef.current?.focus();
      },
      onError: (err) => {
        toast({
          title: "Couldn't capture",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  useEffect(() => {
    if (!open) return;
    setSavedCount(0);
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    createItem.mutate({ data: { title: trimmed, notes: notes.trim() || undefined } });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-primary" />
            {technical ? "QUICK_CAPTURE" : "Quick capture"}
          </DialogTitle>
          <DialogDescription>
            Capture a thought instantly — it lands in your Inbox. Organize it later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <Input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={technical ? "WHAT'S ON YOUR MIND_>" : "What's on your mind?"}
            aria-label="Capture title"
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            className={cn(technical && "font-mono")}
          />
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={technical ? "NOTES (OPTIONAL)" : "Add notes (optional)…"}
            aria-label="Capture notes (optional)"
            rows={3}
            className={cn("resize-none", technical && "font-mono text-sm")}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
          />

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">
              {savedCount > 0 ? (
                <span className="text-primary">
                  ✓ {savedCount} captured — keep going
                </span>
              ) : (
                <>
                  <Kbd>Enter</Kbd> to add another
                </>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Done
              </Button>
              <Button size="sm" onClick={submit} disabled={!title.trim() || createItem.isPending}>
                {createItem.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Add to Inbox
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
