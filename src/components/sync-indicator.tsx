"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useSyncContext } from "@/providers/sync-provider";
import { useLocale } from "@/providers/locale-provider";

export function SyncIndicator() {
  const { syncState, isOnline } = useSyncContext();
  const { t } = useLocale();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-red-500">
        <CloudOff className="h-4 w-4" />
        <span className="text-xs font-medium">{t("offline")}</span>
      </div>
    );
  }

  if (syncState === "syncing") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-amber-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-xs font-medium">{t("syncing")}</span>
      </div>
    );
  }

  if (syncState === "error") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-orange-500">
        <CloudOff className="h-4 w-4" />
        <span className="text-xs font-medium">{t("syncError")}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-500">
      <Cloud className="h-4 w-4" />
      <span className="text-xs font-medium">{t("synced")}</span>
    </div>
  );
}
