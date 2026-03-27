"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/providers/locale-provider";
import { Cog, Zap, Monitor, Wind } from "lucide-react";

const categories = [
  { value: "Mechanical", icon: Cog, color: "blue" },
  { value: "Electrical", icon: Zap, color: "amber" },
  { value: "Software", icon: Monitor, color: "violet" },
  { value: "Pneumatic", icon: Wind, color: "teal" },
] as const;

type Category = (typeof categories)[number]["value"];

interface CategoryChipsProps {
  value: Category | "";
  onValueChange: (value: Category) => void;
}

export function CategoryChips({ value, onValueChange }: CategoryChipsProps) {
  const { t } = useLocale();

  return (
    <div className="grid grid-cols-2 gap-2">
      {categories.map(({ value: cat, icon: Icon }) => {
        const isSelected = value === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onValueChange(cat)}
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
                    : "pneumatic",
            )}
          </button>
        );
      })}
    </div>
  );
}
