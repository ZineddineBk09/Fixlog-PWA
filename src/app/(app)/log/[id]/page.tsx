"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CategoryChips } from "@/components/category-chips";
import { LogHistory } from "@/components/log-history";
import { MachineSelect } from "@/components/machine-select";
import { MotiveSelect } from "@/components/motive-select";
import { StatusToggle } from "@/components/status-toggle";
import {
  createMachine,
  useLog,
  useLogEvents,
  updateLog,
} from "@/hooks/use-logs";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import {
  buildWhatsAppShareUrl,
  cn,
  formatDate,
  formatTime,
  getCategoryLabel,
  getMotiveLabel,
  getStatusLabel,
} from "@/lib/utils";
import type { LogStatus } from "@/lib/db";
import type { LogCategory } from "@/lib/log-categories";
import type { LogMotive } from "@/lib/log-motives";
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [editMachine, setEditMachine] = useState("");
  const [editMotive, setEditMotive] = useState<LogMotive>("Corrective");
  const [editCategory, setEditCategory] = useState<LogCategory[]>([]);
  const [editSymptoms, setEditSymptoms] = useState("");
  const [editSolution, setEditSolution] = useState("");
  const [editStatus, setEditStatus] = useState<LogStatus>("Pending");

  useEffect(() => {
    if (!log) return;

    setEditMachine(log.machine_name);
    setEditMotive(log.motive);
    setEditCategory(log.category);
    setEditSymptoms(log.symptoms);
    setEditSolution(log.solution_applied ?? "");
    setEditStatus(log.status);
  }, [log]);

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
    if (!log) return;
    if (log.status !== "Pending") {
      toast.info(t("reopenAsPending"));
      return;
    }
    if (!isOnline) {
      toast.error(t("cannotEditOffline"));
      return;
    }

    setEditMachine(log.machine_name);
    setEditMotive(log.motive);
    setEditCategory(log.category);
    setEditSymptoms(log.symptoms);
    setEditSolution(log.solution_applied ?? "");
    setEditStatus(log.status);
    setIsEditing(true);
  }

  async function handleToggleStatus() {
    if (!log || !mechanic) return;
    if (!isOnline) {
      toast.error(t("cannotEditOffline"));
      return;
    }

    if (log.status === "Pending") {
      setEditMachine(log.machine_name);
      setEditMotive(log.motive);
      setEditCategory(log.category);
      setEditSymptoms(log.symptoms);
      setEditSolution(log.solution_applied ?? "");
      setEditStatus("Fixed");
      setIsEditing(true);
      return;
    }

    const success = await updateLog(log.id, { status: "Pending" }, mechanic);
    if (success) {
      toast.success(t("statusChangedPending"));
    } else {
      toast.error(t("updateFailed"));
    }
  }

  async function handleSaveEdits() {
    if (!log || !mechanic) return;
    if (!editMachine) {
      toast.error(t("selectMachineError"));
      return;
    }
    if (!editMotive) {
      toast.error(t("selectMotiveError"));
      return;
    }
    if (editCategory.length === 0) {
      toast.error(t("selectCategoryError"));
      return;
    }
    if (!editSymptoms.trim()) {
      toast.error(t("symptomsRequired"));
      return;
    }

    setIsSavingEdits(true);
    const success = await updateLog(
      log.id,
      {
        machine_name: editMachine,
        motive: editMotive,
        category: editCategory,
        symptoms: editSymptoms.trim(),
        solution_applied: editSolution.trim() || null,
        status: editStatus,
      },
      mechanic,
    );
    setIsSavingEdits(false);

    if (!success) {
      toast.error(t("updateFailed"));
      return;
    }

    setIsEditing(false);
    toast.success(
      editStatus === "Fixed" && log.status !== "Fixed"
        ? t("statusChangedFixed")
        : t("saveChanges"),
    );
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
            {getMotiveLabel(log.motive, locale)}
          </Badge>
          {log.category.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="rounded-full px-3 py-1"
            >
              {getCategoryLabel(category, locale)}
            </Badge>
          ))}
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

      {isEditing ? (
        <div className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-card/80">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("machine")}</Label>
              <MachineSelect
                value={editMachine}
                onValueChange={setEditMachine}
                onCreateMachine={createMachine}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("motive")}</Label>
              <MotiveSelect value={editMotive} onValueChange={setEditMotive} />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("category")}</Label>
              <CategoryChips
                value={editCategory}
                onValueChange={setEditCategory}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-symptoms"
                className="text-base font-semibold"
              >
                {t("symptoms")}
              </Label>
              <Textarea
                id="edit-symptoms"
                value={editSymptoms}
                onChange={(e) => setEditSymptoms(e.target.value)}
                placeholder={t("symptomsPlaceholder")}
                rows={4}
                className="min-h-[120px] resize-none rounded-2xl border-white/70 bg-white/85 text-base shadow-sm dark:border-white/10 dark:bg-card/80"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="edit-solution"
                className="text-base font-semibold"
              >
                {t("solution")}{" "}
                <span className="font-normal text-muted-foreground">
                  ({t("optional")})
                </span>
              </Label>
              <Textarea
                id="edit-solution"
                value={editSolution}
                onChange={(e) => setEditSolution(e.target.value)}
                placeholder={t("solutionPlaceholder")}
                rows={3}
                className="min-h-[100px] resize-none rounded-2xl border-white/70 bg-white/85 text-base shadow-sm dark:border-white/10 dark:bg-card/80"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">{t("status")}</Label>
              <StatusToggle value={editStatus} onValueChange={setEditStatus} />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 rounded-2xl"
                onClick={() => setIsEditing(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="button"
                className="h-12 flex-1 rounded-2xl"
                onClick={handleSaveEdits}
                disabled={isSavingEdits}
              >
                {isSavingEdits ? t("savingChanges") : t("saveChanges")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
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
        </>
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
              disabled={isEditing}
            >
              <Share2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t("shareViaWhatsApp")}
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="h-12 rounded-2xl"
              disabled={isEditing || log.status !== "Pending"}
              aria-label={t("editBreakdown")}
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
