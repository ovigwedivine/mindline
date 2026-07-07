import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
  getListWorkspacesQueryKey,
  setWorkspaceId,
} from "@workspace/api-client-react";

export interface WorkspaceItem {
  id: number;
  name: string;
  createdAt: string;
}

interface WorkspaceContextValue {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  activeId: number | null;
  isLoading: boolean;
  switchWorkspace: (id: number) => void;
  createWorkspace: (name: string) => Promise<WorkspaceItem>;
  renameWorkspace: (id: number, name: string) => Promise<void>;
  deleteWorkspace: (id: number) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const STORAGE_KEY = "mindline-workspace-id";

function readStoredId(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (!v) return null;
    const n = parseInt(v, 10);
    return isNaN(n) || n <= 0 ? null : n;
  } catch {
    return null;
  }
}

function writeStoredId(id: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(id));
  } catch {}
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const [activeId, setActiveId] = useState<number | null>(() => {
    const stored = readStoredId();
    if (stored !== null) setWorkspaceId(stored);
    return stored;
  });

  const seededRef = useRef(false);

  const { data: workspaces = [], isLoading } = useListWorkspaces({
    query: { queryKey: getListWorkspacesQueryKey(), staleTime: 60_000 },
  });

  const createMutation = useCreateWorkspace();
  const updateMutation = useUpdateWorkspace();
  const deleteMutation = useDeleteWorkspace();

  useEffect(() => {
    if (isLoading || workspaces.length === 0) return;

    const storedId = readStoredId();
    const isValid = storedId !== null && workspaces.some((w) => w.id === storedId);

    if (isValid && !seededRef.current) {
      seededRef.current = true;
      setActiveId(storedId);
      setWorkspaceId(storedId);
    } else if (!isValid) {
      seededRef.current = true;
      const first = workspaces[0];
      setActiveId(first.id);
      setWorkspaceId(first.id);
      writeStoredId(first.id);
    }
  }, [workspaces, isLoading]);

  const switchWorkspace = (id: number) => {
    setActiveId(id);
    setWorkspaceId(id);
    writeStoredId(id);
    queryClient.invalidateQueries();
  };

  const createWorkspace = async (name: string): Promise<WorkspaceItem> => {
    const result = await createMutation.mutateAsync({ data: { name } });
    await queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
    return result as WorkspaceItem;
  };

  const renameWorkspace = async (id: number, name: string): Promise<void> => {
    await updateMutation.mutateAsync({ id, data: { name } });
    await queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
  };

  const deleteWorkspace = async (id: number): Promise<void> => {
    await deleteMutation.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListWorkspacesQueryKey() });
    if (activeId === id) {
      const remaining = workspaces.filter((w) => w.id !== id);
      if (remaining.length > 0) {
        switchWorkspace(remaining[0].id);
      }
    }
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        activeId,
        isLoading,
        switchWorkspace,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
