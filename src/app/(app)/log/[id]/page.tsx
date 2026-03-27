"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogHistory } from "@/components/log-history";
import { useLog, useLogEvents, updateLog } from "@/hooks/use-logs";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  buildWhatsAppShareUrl,
  cn,
  formatDate,
  formatTime,
  getCategoryLabel,
  getStatusLabel,
} from "@/lib/utils";
import {
  ArrowLeft,
  Share2,
  Pencil,
  User,
  Clock,
  Check,
  AlertCircle,
} from "lucide-react";

export default function LogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { log, isLoading } = useLog(id);
  const { events, isLoading: isEventsLoading } = useLogEvents(id);
  const { isOnline } = useOnlineStatus();
  const { mechanic } = useAuthContext();
  const { locale, t, isRTL } = useLocale();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-lg font-medium">{t("logNotFound")}</p>
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mt-4"
        >
          {t("goBackToFeed")}
        </Button>
      </div>
    );
  }

  function handleShare() {
    if (!log) return;
    const baseUrl = globalThis.location?.origin ?? "";
    const url = buildWhatsAppShareUrl(
      log.id,
      log.machine_name,
      log.symptoms,
      log.status,
      baseUrl,
      locale,
    );
    window.open(url, "_blank");
  }

  function handleEdit() {
    if (!isOnline) {
      toast.error(t("cannotEditOffline"));
      return;
    }
    toast.info(t("editComingSoon"));
  }

  async function handleToggleStatus() {
    if (!log || !mechanic) return;
    if (!isOnline) {
      toast.error(t("cannotEditOffline"));
      return;
    }
    const newStatus = log.status === "Pending" ? "Fixed" : "Pending";
    const success = await updateLog(log.id, { status: newStatus }, mechanic);
    if (success) {
      toast.success(
        newStatus === "Fixed"
          ? t("statusChangedFixed")
          : t("statusChangedPending"),
      );
    } else {
      toast.error(t("updateFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <button
        type="button"
        onClick={() => router.back()}
        className={cn(
          "flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
          !isRTL && "-ml-1",
        )}
      >
        <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
        {t("back")}
      </button>

      <div className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/80">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{log.machine_name}</h1>
          <Badge
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-sm",
              log.status === "Fixed"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
            )}
          >
            {log.status === "Fixed" ? (
              <Check className={cn("h-3.5 w-3.5", isRTL ? "ml-1" : "mr-1")} />
            ) : (
              <AlertCircle
                className={cn("h-3.5 w-3.5", isRTL ? "ml-1" : "mr-1")}
              />
            )}
            {getStatusLabel(log.status, locale)}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            {getCategoryLabel(log.category, locale)}
          </Badge>
          {log.sync_status === "pending_insert" && (
            <Badge
              variant="outline"
              className="rounded-full border-amber-300 text-amber-600"
            >
              {t("notSynced")}
            </Badge>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {t("createdBy")}: {log.author_name}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {t("createdOn")}: {formatDate(log.created_at, locale)}{" "}
            {formatTime(log.created_at, locale)}
          </span>
        </div>
      </div>

      {log.image_url && (
        <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-sm dark:border-white/10 dark:bg-card/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={log.image_url}
            alt={`Photo for ${log.machine_name}`}
            className="max-h-80 w-full bg-muted object-contain"
          />
        </div>
      )}

      <div className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-card/80">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("symptoms")}
          </h2>
          <p className="text-base leading-7">{log.symptoms}</p>
        </div>
      </div>

      {log.solution_applied && (
        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-card/80">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("solution")}
            </h2>
            <p className="text-base leading-7">{log.solution_applied}</p>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-card/80">
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={handleToggleStatus}
            variant="outline"
            className="h-12 rounded-2xl text-base"
          >
            {log.status === "Pending" ? (
              <>
                <Check className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                {t("markAsFixed")}
              </>
            ) : (
              <>
                <AlertCircle
                  className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")}
                />
                {t("reopenAsPending")}
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
              className="h-12 flex-1 rounded-2xl text-base"
            >
              <Share2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("shareViaWhatsApp")}
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="h-12 rounded-2xl"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        {isEventsLoading ? (
          <Skeleton className="h-40 rounded-[2rem]" />
        ) : (
          <LogHistory events={events} />
        )}
      </div>
    </div>
  );
}
