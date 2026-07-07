import React, { useEffect, useRef, useState } from "react";
import { useWorkspace } from "@/lib/workspace-context";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Pencil, Trash2, Plus, X } from "lucide-react";

/** WorkspaceSwitcher auto-reads the active theme's styleProfile.
 *  No variant prop needed — any layout works with any theme. */
export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace, renameWorkspace, deleteWorkspace } =
    useWorkspace();
  const { styleProfile } = useTheme();
  const soft = styleProfile === "friendly";

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
        setCreating(false);
        setDeletingId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (editingId !== null) editInputRef.current?.focus();
  }, [editingId]);

  useEffect(() => {
    if (creating) createInputRef.current?.focus();
  }, [creating]);

  const startEdit = (id: number, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditingName(name);
    setCreating(false);
    setDeletingId(null);
  };

  const commitEdit = async () => {
    if (!editingId || !editingName.trim()) { setEditingId(null); return; }
    await renameWorkspace(editingId, editingName.trim());
    setEditingId(null);
  };

  const commitCreate = async () => {
    if (!newName.trim()) { setCreating(false); setNewName(""); return; }
    const ws = await createWorkspace(newName.trim());
    setCreating(false);
    setNewName("");
    switchWorkspace(ws.id);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) { await deleteWorkspace(id); setDeletingId(null); }
    else setDeletingId(id);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          soft
            ? "px-3 py-1.5 rounded-full border border-border bg-muted/40 text-sm font-medium text-foreground hover:bg-muted"
            : "px-2 py-1 rounded border border-border/50 bg-background/50 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-border",
        )}
      >
        <span className={cn(soft ? "max-w-[120px] truncate" : "max-w-[100px] truncate font-mono")}>
          {activeWorkspace?.name ?? "…"}
        </span>
        <ChevronDown className={cn("shrink-0 transition-transform", soft ? "h-3.5 w-3.5" : "h-3 w-3", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 z-50 mt-1.5 min-w-[200px] border border-border bg-card shadow-lg overflow-hidden",
          soft ? "rounded-2xl" : "rounded-md",
        )}>
          <div className="p-1.5 flex flex-col gap-0.5">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspace?.id;
              const isEditing = editingId === ws.id;
              const isDeleting = deletingId === ws.id;
              return (
                <div
                  key={ws.id}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 group",
                    soft ? "rounded-xl" : "rounded",
                    isActive ? "bg-primary/10" : "hover:bg-muted/60",
                    !isEditing && "cursor-pointer",
                  )}
                  onClick={() => { if (!isEditing) { switchWorkspace(ws.id); setOpen(false); } }}
                >
                  <Check className={cn("shrink-0 h-3 w-3 text-primary", isActive ? "opacity-100" : "opacity-0")} />
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 min-w-0 bg-transparent border-b border-primary outline-none text-sm py-0.5"
                    />
                  ) : (
                    <span className={cn("flex-1 min-w-0 truncate text-sm", isActive ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {ws.name}
                    </span>
                  )}
                  <div
                    className={cn("flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", isEditing && "opacity-100")}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isEditing ? (
                      <button onClick={commitEdit} className="p-1 rounded text-primary hover:bg-primary/10" title="Save">
                        <Check className="h-3 w-3" />
                      </button>
                    ) : (
                      <button onClick={(e) => startEdit(ws.id, ws.name, e)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Rename">
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(ws.id, e)}
                        className={cn("p-1 rounded transition-colors", isDeleting ? "text-destructive bg-destructive/10 hover:bg-destructive/20" : "text-muted-foreground hover:text-destructive hover:bg-destructive/10")}
                        title={isDeleting ? "Click again to confirm delete" : "Delete workspace"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border px-2 pb-2 pt-1.5">
            {creating ? (
              <div className="flex items-center gap-1.5">
                <Plus className="h-3 w-3 text-muted-foreground shrink-0" />
                <input
                  ref={createInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitCreate(); if (e.key === "Escape") { setCreating(false); setNewName(""); } }}
                  placeholder="Workspace name…"
                  className={cn("flex-1 min-w-0 bg-transparent outline-none text-sm border-b border-primary py-0.5", !soft && "font-mono")}
                />
                <button onClick={() => { setCreating(false); setNewName(""); }} className="p-0.5 rounded text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setCreating(true); setEditingId(null); setDeletingId(null); }}
                className={cn("w-full flex items-center gap-1.5 px-1 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors", soft ? "rounded-lg hover:bg-muted/60" : "rounded hover:bg-muted/40")}
              >
                <Plus className="h-3 w-3" /> New workspace
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
