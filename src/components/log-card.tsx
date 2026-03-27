"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatRelativeTime,
  getCategoryLabel,
  getStatusLabel,
} from "@/lib/utils";
import { type LogRecord } from "@/lib/db";
import { ArrowRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";

interface LogCardProps {
  log: LogRecord;
}

export function LogCard({ log }: LogCardProps) {
  const { locale, isRTL, t } = useLocale();

  return (
    <Link href={`/log/${log.id}`}>
      <Card className="rounded-3xl border-white/60 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] dark:border-white/10 dark:bg-card/90">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="truncate text-base font-semibold">
                {log.machine_name}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {getCategoryLabel(log.category, locale)}
                </Badge>
                <Badge
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs",
                    log.status === "Fixed"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                  )}
                >
                  {getStatusLabel(log.status, locale)}
                </Badge>
              </div>
            </div>
            {log.sync_status === "pending_insert" && (
              <div
                className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.15)]"
                title={t("notSynced")}
              />
            )}
          </div>

          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {log.symptoms}
          </p>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                {log.author_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(log.created_at, locale)}
              </span>
            </div>
            <ArrowRight
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isRTL && "rotate-180",
              )}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
