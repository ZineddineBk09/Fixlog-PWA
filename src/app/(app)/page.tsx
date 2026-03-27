"use client";

import { useState, useCallback } from "react";
import { useLogs, type LogFilters } from "@/hooks/use-logs";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { useSyncContext } from "@/providers/sync-provider";
import { SearchBar } from "@/components/search-bar";
import { LogCard } from "@/components/log-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

type QuickFilter = "all" | "pending" | "mine";

export default function FeedPage() {
  const { mechanic } = useAuthContext();
  const { t } = useLocale();
  const { triggerSync } = useSyncContext();
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const filterChips: { key: QuickFilter; label: string }[] = [
    { key: "all", label: t("all") },
    { key: "pending", label: t("pendingOnly") },
    { key: "mine", label: t("mine") },
  ];

  const filters: LogFilters = {
    search: search || undefined,
    status: quickFilter === "pending" ? "Pending" : undefined,
    authorName: quickFilter === "mine" ? mechanic?.name : undefined,
  };

  const { logs, isLoading, refresh } = useLogs(filters);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await triggerSync();
    await refresh();
    setIsRefreshing(false);
  }, [triggerSync, refresh]);

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="rounded-[2rem] border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{t("feed")}</h1>
            <p className="text-sm text-muted-foreground">{mechanic?.name}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="rounded-2xl border border-white/70 bg-white/80 p-3 text-muted-foreground shadow-sm transition-colors hover:bg-accent active:bg-accent/70 dark:border-white/10 dark:bg-card/80"
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </button>
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {filterChips.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setQuickFilter(key)}
            className="rounded-full"
          >
            <Badge
              variant={quickFilter === key ? "default" : "secondary"}
              className={cn(
                "cursor-pointer rounded-full px-4 py-2 text-sm transition-colors",
                quickFilter === key
                  ? "bg-primary hover:bg-primary/90"
                  : "border border-white/60 bg-white/80 text-muted-foreground dark:border-white/10 dark:bg-card/70",
              )}
            >
              {label}
            </Badge>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-y-3 rounded-[2rem] border border-dashed border-border/80 bg-white/60 py-20 text-center dark:bg-card/40">
          <p className="text-lg font-medium text-muted-foreground">
            {search ? t("noLogsSearch") : t("noLogs")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? t("tryDifferentKeywords") : t("createFirstLog")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-y-3">
          {logs.map((log) => (
            <LogCard key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
