"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, ClipboardList, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingCount } from "@/hooks/use-logs";
import { useLocale } from "@/providers/locale-provider";

export function BottomNav() {
  const pathname = usePathname();
  const pendingCount = usePendingCount();
  const { t, isRTL } = useLocale();
  const navItems = [
    { href: "/", label: t("feed"), icon: Home },
    { href: "/new", label: t("newLog"), icon: PlusCircle },
    { href: "/pending", label: t("pendingTasks"), icon: ClipboardList },
    { href: "/invite", label: t("invites"), icon: UserPlus },
  ] as const;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10">
      <div className="mx-auto flex h-18 max-w-lg items-center justify-around px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isPending = href === "/pending";

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[52px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-all",
                "active:bg-accent/60",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon
                  className={cn("h-6 w-6", href === "/new" && "h-7 w-7")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {isPending && pendingCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-sm",
                      isRTL ? "-left-2.5" : "-right-2.5",
                    )}
                  >
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
