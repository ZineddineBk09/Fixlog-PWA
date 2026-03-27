"use client";

import { WifiOff } from "lucide-react";
import { useLocale } from "@/providers/locale-provider";

export default function OfflinePage() {
  const { t } = useLocale();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">{t("installOfflineTitle")}</h1>
      <p className="text-muted-foreground max-w-sm">
        {t("installOfflineDescription")}
      </p>
    </div>
  );
}
