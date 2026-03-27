"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { syncService } from "@/lib/sync-service";
import { useOnlineStatus } from "@/hooks/use-online-status";

type SyncState = "idle" | "syncing" | "synced" | "error";

interface SyncContextValue {
  syncState: SyncState;
  isOnline: boolean;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useOnlineStatus();
  const [syncState, setSyncState] = useState<SyncState>("idle");

  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncState("syncing");
    try {
      const success = await syncService.syncAll();
      setSyncState(success ? "synced" : "error");
    } catch {
      setSyncState("error");
    }
  }, []);

  useEffect(() => {
    triggerSync();
  }, [triggerSync]);

  useEffect(() => {
    if (isOnline) {
      triggerSync();
    }
  }, [isOnline, triggerSync]);

  return (
    <SyncContext.Provider value={{ syncState, isOnline, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error("useSyncContext must be used within a SyncProvider");
  }
  return ctx;
}
