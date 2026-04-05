"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { Cog, Droplets, Monitor, Wind, Zap } from "lucide-react";
import { logCategories, type LogCategory } from "@/lib/log-categories";

const categories = [
  { value: "Mechanical", icon: Cog },
  { value: "Electrical", icon: Zap },
  { value: "Software", icon: Monitor },
  { value: "Pneumatic", icon: Wind },
  { value: "Hydraulics", icon: Droplets },
] as const;

interface CategoryChipsProps {
  value: LogCategory[];
  onValueChange: (value: LogCategory[]) => void;
}

export function CategoryChips({ value, onValueChange }: CategoryChipsProps) {
  const { t } = useLocale();

  function toggleCategory(category: LogCategory) {
    if (value.includes(category)) {
      onValueChange(value.filter((item) => item !== category));
      return;
    }

    const ordered = logCategories.filter((item) =>
      item === category ? true : value.includes(item),
    );
    onValueChange(ordered);
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {categories.map(({ value: cat, icon: Icon }) => {
        const isSelected = value.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => toggleCategory(cat)}
            className={cn(
              "flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold shadow-sm transition-all active:scale-95",
              "min-h-[56px]",
              isSelected
                ? "border-primary bg-primary/8 text-primary dark:bg-primary/15"
                : "border-white/70 bg-white/80 text-foreground hover:bg-accent dark:border-white/10 dark:bg-card/80",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {t(
              cat === "Mechanical"
                ? "mechanical"
                : cat === "Electrical"
                  ? "electrical"
                  : cat === "Software"
                    ? "software"
                    : cat === "Pneumatic"
                      ? "pneumatic"
                      : "hydraulics",
            )}
          </button>
        );
      })}
    </div>
  );
}
