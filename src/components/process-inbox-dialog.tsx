import React, { useEffect, useState } from "react";
import type { InboxItem } from "@workspace/api-client-react";
import {
  useProcessInboxItem,
  useListProjects,
  getListInboxItemsQueryKey,
  getGetInboxStatsQueryKey,
  getListTasksQueryKey,
  getGetTaskStatsQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/lib/workspace-context";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListTodo, FolderOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Target = "task" | "project";

export function ProcessInboxDialog({
  item,
  open,
  onOpenChange,
}: {
  item: InboxItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { workspaces, activeId } = useWorkspace();

  const [target, setTarget] = useState<Target>("task");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("none");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [deadline, setDeadline] = useState<string>("");

  const { data: projects } = useListProjects(undefined, {
    query: {
      queryKey: [...getListProjectsQueryKey(), "ws", workspaceId],
      enabled: open && target === "task" && !!workspaceId,
    },
    request: workspaceId ? { headers: { "x-workspace-id": workspaceId } } : undefined,
  });

  useEffect(() => {
    if (open) {
      setTarget("task");
      setWorkspaceId(activeId ? String(activeId) : workspaces[0] ? String(workspaces[0].id) : "");
      setProjectId("none");
      setPriority("medium");
      setDeadline("");
    }
  }, [open, activeId, workspaces]);

  // Reset project selection whenever the target workspace changes — projects
  // are scoped to a workspace, so a stale projectId would be invalid.
  useEffect(() => {
    setProjectId("none");
  }, [workspaceId]);

  const processItem = useProcessInboxItem({
    mutation: {
      onSuccess: (result) => {
        queryClient.invalidateQueries({ queryKey: getListInboxItemsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInboxStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetTaskStatsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        toast({
          title: result.createdType === "task" ? "Converted to task" : "Converted to project",
          description: `"${item?.title}" is now organized.`,
        });
        onOpenChange(false);
      },
      onError: (err) => {
        toast({
          title: "Couldn't process item",
          description: (err as any)?.message || "An error occurred",
          variant: "destructive",
        });
      },
    },
  });

  function submit() {
    if (!item) return;
    const ws = Number(workspaceId);
    if (!ws) {
      toast({ title: "Select a workspace", variant: "destructive" });
      return;
    }
    processItem.mutate({
      id: item.id,
      data: {
        target,
        workspaceId: ws,
        projectId:
          target === "task" && projectId !== "none" ? Number(projectId) : undefined,
        priority: target === "task" ? priority : undefined,
        deadline: deadline || undefined,
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process inbox item</DialogTitle>
          <DialogDescription className="truncate">
            {item ? `"${item.title}"` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Target selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTarget("task")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
                target === "task"
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <ListTodo className="h-4 w-4" /> Task
            </button>
            <button
              type="button"
              onClick={() => setTarget("project")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
                target === "project"
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <FolderOpen className="h-4 w-4" /> Project
            </button>
          </div>

          {/* Workspace */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Workspace</Label>
            <Select value={workspaceId} onValueChange={setWorkspaceId}>
              <SelectTrigger aria-label="Workspace">
                <SelectValue placeholder="Select workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task-only: project + priority */}
          {target === "task" && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Project (optional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger aria-label="Project (optional)">
                    <SelectValue placeholder="No project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No project</SelectItem>
                    {(projects ?? []).map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger aria-label="Priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Deadline / due date */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              {target === "task" ? "Deadline (optional)" : "Due date (optional)"}
            </Label>
            <Input
              type="date"
              value={deadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setDeadline(e.target.value)}
              aria-label={target === "task" ? "Deadline (optional)" : "Due date (optional)"}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={processItem.isPending || !workspaceId}>
              {processItem.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {target === "task" ? "Create task" : "Create project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
