"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/providers/locale-provider";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const { isRTL, t } = useLocale();

  return (
    <div className="relative">
      <Search
        className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground ${
          isRTL ? "right-3" : "left-3"
        }`}
      />
      <Input
        type="search"
        placeholder={placeholder ?? t("searchLogs")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 rounded-2xl border-white/70 bg-white/90 text-base shadow-sm dark:border-white/10 dark:bg-card/80 ${
          isRTL ? "pr-10 pl-10" : "pl-10 pr-10"
        }`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-accent ${
            isRTL ? "left-3" : "right-3"
          }`}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
