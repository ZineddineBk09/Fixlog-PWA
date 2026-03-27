"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Copy,
  RefreshCw,
  Share2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { inviteService, type InviteRecord } from "@/lib/invite-service";
import {
  buildInviteShareText,
  cn,
  formatDate,
  getInviteStatusLabel,
} from "@/lib/utils";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";

function statusBadgeClass(status: InviteRecord["status"]) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "expired":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    case "revoked":
      return "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  }
}

export default function InvitePage() {
  const { mechanic } = useAuthContext();
  const { locale, t } = useLocale();
  const [note, setNote] = useState("");
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const inviteBaseUrl = useMemo(() => globalThis.location?.origin ?? "", []);

  const loadInvites = useCallback(async () => {
    if (!mechanic) return;

    setIsLoading(true);
    const result = await inviteService.listInvites(mechanic.id);
    if (result.success) {
      setInvites(result.invites);
    } else if (result.errorKey !== "inviteNeedsInternet") {
      toast.error(t(result.errorKey));
    }
    setIsLoading(false);
  }, [mechanic, t]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadInvites();
    setIsRefreshing(false);
  }

  async function handleCreateInvite() {
    if (!mechanic) return;

    setIsCreating(true);
    const result = await inviteService.createInvite(mechanic, note);
    setIsCreating(false);

    if (!result.success) {
      toast.error(t(result.errorKey));
      return;
    }

    setInvites((current) => [result.invite, ...current]);
    setNote("");
    toast.success(t("inviteCreated"));
  }

  async function handleCopy(invite: InviteRecord) {
    const inviteUrl = `${inviteBaseUrl}/join/${invite.token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success(t("inviteCopied"));
    } catch {
      toast.error(t("inviteCreateFailed"));
    }
  }

  async function handleShare(invite: InviteRecord) {
    const inviteUrl = `${inviteBaseUrl}/join/${invite.token}`;
    const text = buildInviteShareText(inviteUrl, mechanic?.name ?? "", locale);

    try {
      if (navigator.share) {
        await navigator.share({
          title: t("inviteTeammates"),
          text,
          url: inviteUrl,
        });
        return;
      }

      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } catch {
      toast.error(t("inviteCreateFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/80">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("inviteTeammates")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("inviteDescription")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="rounded-xl"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label={t("refresh")}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          <label className="text-sm font-medium">{t("inviteNote")}</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("inviteNotePlaceholder")}
            className="min-h-24 rounded-2xl bg-white/80 dark:bg-card/80"
          />
          <p className="text-xs text-muted-foreground">
            {t("inviteOnlyAccess")}
          </p>
          <Button
            type="button"
            onClick={handleCreateInvite}
            disabled={isCreating}
            className="h-12 rounded-2xl px-6"
          >
            {isCreating ? t("creatingInvite") : t("inviteCreate")}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {isLoading ? (
          <div className="rounded-[2rem] border border-dashed border-border/70 bg-white/60 p-8 text-center text-sm text-muted-foreground dark:bg-card/40">
            {t("syncing")}
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border/70 bg-white/60 p-8 text-center text-sm text-muted-foreground dark:bg-card/40">
            {t("noInvitesYet")}
          </div>
        ) : (
          invites.map((invite) => {
            const inviteUrl = `${inviteBaseUrl}/join/${invite.token}`;

            return (
              <article
                key={invite.id}
                className="rounded-[2rem] border border-white/60 bg-white/85 p-5 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-card/80"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("inviteLink")}
                    </p>
                    <p className="break-all text-sm font-medium">{inviteUrl}</p>
                  </div>
                  <Badge
                    className={cn(
                      "rounded-full px-3 py-1",
                      statusBadgeClass(invite.status),
                    )}
                  >
                    {getInviteStatusLabel(invite.status, locale)}
                  </Badge>
                </div>

                {invite.note && (
                  <p className="mt-4 rounded-2xl bg-muted/60 px-4 py-3 text-sm">
                    {invite.note}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4" />
                    {t("inviteExpiresOn", {
                      date: formatDate(invite.expires_at, locale),
                    })}
                  </p>
                  {invite.accepted_mechanic_name && (
                    <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("inviteAcceptedBy", {
                        name: invite.accepted_mechanic_name,
                      })}
                    </p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => handleCopy(invite)}
                  >
                    <Copy className="h-4 w-4" />
                    {t("inviteCopy")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => handleShare(invite)}
                  >
                    <Share2 className="h-4 w-4" />
                    {t("inviteShare")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-2xl"
                    onClick={() => window.open(inviteUrl, "_blank")}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {t("inviteOpen")}
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
