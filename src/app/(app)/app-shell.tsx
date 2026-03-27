"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { BottomNav } from "@/components/bottom-nav";
import { SyncIndicator } from "@/components/sync-indicator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages, LogOut } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading, mechanic, logout } = useAuthContext();
  const { locale, toggleLocale, t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_35%),linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_25%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,1))]">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-background/80 px-4 py-3 backdrop-blur-xl dark:border-white/10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-primary">{t("appName")}</p>
            <p className="text-xs text-muted-foreground">{t("appTagline")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl"
              onClick={toggleLocale}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">
                {locale === "ar" ? t("switchToEnglish") : t("switchToArabic")}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-9 w-9 rounded-xl"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              aria-label={t("logout")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <SyncIndicator />
          <span className="max-w-[140px] truncate text-xs text-muted-foreground">
            {mechanic?.name}
          </span>
        </div>
      </header>
      <main className="flex flex-1 flex-col pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
