"use client";

import { Clock3, Dot, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/providers/locale-provider";
import { getEventMessage, formatDate, formatTime } from "@/lib/utils";
import type { LogEventRecord } from "@/lib/db";

interface LogHistoryProps {
  events: LogEventRecord[];
}

export function LogHistory({ events }: LogHistoryProps) {
  const { locale, t } = useLocale();

  return (
    <Card className="rounded-3xl border-white/60 bg-white/85 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/90">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" />
          {t("activityHistory")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noHistoryYet")}</p>
        ) : (
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Dot className="h-5 w-5" />
                  </div>
                  {index < events.length - 1 && (
                    <div className="mt-1 h-full w-px bg-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1 pb-2">
                  <p className="font-medium leading-6">{event.actor_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getEventMessage(event, locale)}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    {formatDate(event.occurred_at, locale)}{" "}
                    {formatTime(event.occurred_at, locale)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
