"use client";

import { useLogs } from "@/hooks/use-logs";
import { useLocale } from "@/providers/locale-provider";
import { LogCard } from "@/components/log-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export default function PendingPage() {
  const { t } = useLocale();
  const { logs, isLoading } = useLogs({ status: "Pending" });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2 rounded-[2rem] border border-white/60 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-card/70">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">{t("pendingTasks")}</h1>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">({logs.length})</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/80 bg-white/60 py-16 text-center dark:bg-card/40">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <AlertCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-lg font-medium">{t("allClear")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("noPendingTasks")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
