"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { Check, AlertCircle } from "lucide-react";

interface StatusToggleProps {
  value: "Fixed" | "Pending";
  onValueChange: (value: "Fixed" | "Pending") => void;
}

export function StatusToggle({ value, onValueChange }: StatusToggleProps) {
  const { t } = useLocale();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onValueChange("Fixed")}
        className={cn(
          "flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-4 text-base font-semibold shadow-sm transition-all active:scale-95",
          value === "Fixed"
            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500"
            : "border-white/70 bg-white/80 text-muted-foreground dark:border-white/10 dark:bg-card/80",
        )}
      >
        <Check className="h-5 w-5" />
        {t("fixed")}
      </button>
      <button
        type="button"
        onClick={() => onValueChange("Pending")}
        className={cn(
          "flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-4 text-base font-semibold shadow-sm transition-all active:scale-95",
          value === "Pending"
            ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-500"
            : "border-white/70 bg-white/80 text-muted-foreground dark:border-white/10 dark:bg-card/80",
        )}
      >
        <AlertCircle className="h-5 w-5" />
        {t("pending")}
      </button>
    </div>
  );
}
