"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MachineSelect } from "@/components/machine-select";
import { CategoryChips } from "@/components/category-chips";
import { StatusToggle } from "@/components/status-toggle";
import { CameraInput } from "@/components/camera-input";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { createLog, createMachine } from "@/hooks/use-logs";
import { formatDate, formatTime } from "@/lib/utils";
import type { LogRecord } from "@/lib/db";

type Category = LogRecord["category"];

export default function NewLogPage() {
  const router = useRouter();
  const { mechanic } = useAuthContext();
  const { locale, t } = useLocale();

  const [machine, setMachine] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [symptoms, setSymptoms] = useState("");
  const [solution, setSolution] = useState("");
  const [status, setStatus] = useState<"Fixed" | "Pending">("Pending");
  const [imageBase64, setImageBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const now = new Date().toISOString();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!machine) {
      toast.error(t("selectMachineError"));
      return;
    }
    if (!category) {
      toast.error(t("selectCategoryError"));
      return;
    }
    if (!symptoms.trim()) {
      toast.error(t("symptomsRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      if (!mechanic) {
        toast.error(t("noSignedInMechanic"));
        return;
      }

      await createLog(
        {
          author_name: mechanic.name,
          machine_name: machine,
          category: category as Category,
          symptoms: symptoms.trim(),
          solution_applied: solution.trim() || null,
          status,
          image_url: imageBase64 || null,
        },
        mechanic,
      );

      toast.success(t("logSaved"));
      router.push("/");
    } catch (error) {
      console.error("Failed to create log:", error);
      toast.error(t("saveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
        <h1 className="mb-2 text-xl font-bold">{t("newBreakdownLog")}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{mechanic?.name}</span>
          <span>{t("currentTimeSeparator")}</span>
          <span>{formatDate(now, locale)}</span>
          <span>{formatTime(now, locale)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("machine")}</Label>
            <MachineSelect
              value={machine}
              onValueChange={setMachine}
              onCreateMachine={createMachine}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("category")}</Label>
            <CategoryChips
              value={category}
              onValueChange={(v) => setCategory(v)}
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
          <div className="space-y-2">
            <Label htmlFor="symptoms" className="text-base font-semibold">
              {t("symptoms")}
            </Label>
            <Textarea
              id="symptoms"
              placeholder={t("symptomsPlaceholder")}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              rows={4}
              className="min-h-[120px] resize-none rounded-2xl border-white/70 bg-white/85 text-base shadow-sm dark:border-white/10 dark:bg-card/80"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
          <div className="space-y-2">
            <Label htmlFor="solution" className="text-base font-semibold">
              {t("solution")}{" "}
              <span className="font-normal text-muted-foreground">
                ({t("optional")})
              </span>
            </Label>
            <Textarea
              id="solution"
              placeholder={t("solutionPlaceholder")}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={3}
              className="min-h-[100px] resize-none rounded-2xl border-white/70 bg-white/85 text-base shadow-sm dark:border-white/10 dark:bg-card/80"
            />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("photo")}</Label>
            <CameraInput onImageProcessed={setImageBase64} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/70">
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("status")}</Label>
            <StatusToggle value={status} onValueChange={setStatus} />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-14 w-full rounded-2xl text-lg font-semibold shadow-lg shadow-primary/20"
        >
          {isSubmitting ? t("saving") : t("saveLog")}
        </Button>
      </form>
    </div>
  );
}
