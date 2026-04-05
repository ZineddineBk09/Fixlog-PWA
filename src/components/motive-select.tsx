"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logMotives, type LogMotive } from "@/lib/log-motives";
import { useLocale } from "@/providers/locale-provider";
import { getMotiveLabel } from "@/lib/utils";

interface MotiveSelectProps {
  value: LogMotive | "";
  onValueChange: (value: LogMotive) => void;
}

export function MotiveSelect({ value, onValueChange }: MotiveSelectProps) {
  const { locale, t } = useLocale();

  return (
    <Select
      value={value}
      onValueChange={(next) => next && onValueChange(next as LogMotive)}
    >
      <SelectTrigger className="h-14 w-full rounded-2xl border-white/70 bg-white/90 text-base shadow-sm dark:bg-card/80">
        <SelectValue placeholder={t("selectMotive")} />
      </SelectTrigger>
      <SelectContent className="max-h-[min(70vh,24rem)] rounded-2xl">
        {logMotives.map((motive) => (
          <SelectItem key={motive} value={motive} className="py-3 text-base">
            {getMotiveLabel(motive, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
