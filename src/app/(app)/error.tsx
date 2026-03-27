"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/locale-provider";
import { AlertTriangle } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mb-2 text-xl font-bold">{t("somethingWentWrong")}</h2>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {t("localDataSafe")}
      </p>
      <Button onClick={reset} className="h-12 px-6 text-base">
        {t("tryAgain")}
      </Button>
    </div>
  );
}
