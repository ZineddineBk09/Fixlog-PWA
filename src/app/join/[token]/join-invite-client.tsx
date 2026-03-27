"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  inviteService,
  type InviteErrorKey,
  type PublicInviteRecord,
} from "@/lib/invite-service";
import { formatDate, getInviteStatusLabel } from "@/lib/utils";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";

export function JoinInviteClient({ token }: { token: string }) {
  const router = useRouter();
  const { authenticate, isLoggedIn } = useAuthContext();
  const { locale, t } = useLocale();
  const [invite, setInvite] = useState<PublicInviteRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<InviteErrorKey | "">("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function loadInvite() {
      setIsLoading(true);
      const result = await inviteService.getInvite(token);

      if (!result.success) {
        setErrorKey(result.errorKey);
        setIsLoading(false);
        return;
      }

      if (!result.invite) {
        setErrorKey("inviteInvalid");
        setIsLoading(false);
        return;
      }

      setInvite(result.invite);
      if (result.invite.status !== "pending") {
        setErrorKey(
          result.invite.status === "accepted"
            ? "inviteAlreadyUsed"
            : result.invite.status === "expired"
              ? "inviteExpired"
              : "inviteRevoked",
        );
      } else {
        setErrorKey("");
      }
      setIsLoading(false);
    }

    loadInvite();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorKey("");

    if (!name.trim()) {
      setErrorKey("inviteNameRequired");
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setErrorKey("invitePinInvalid");
      return;
    }

    if (pin !== confirmPin) {
      setErrorKey("invitePinMismatch");
      return;
    }

    setIsSubmitting(true);
    const result = await inviteService.acceptInvite(token, name, pin);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorKey(result.errorKey);
      return;
    }

    authenticate(result.mechanic);
    toast.success(t("inviteJoinSuccess"));
    router.replace("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_35%),linear-gradient(180deg,rgba(239,246,255,1),rgba(255,255,255,1))] px-6 dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_25%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,1))]">
      <div className="w-full max-w-sm space-y-8 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/25">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("joinTitle")}
          </h1>
          <p className="text-center text-muted-foreground">
            {t("joinSubtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("syncing")}
          </div>
        ) : errorKey ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm font-medium text-amber-700 dark:text-amber-300">
              {t(errorKey)}
            </div>
            {invite && (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm text-muted-foreground dark:border-white/10 dark:bg-card/70">
                <p>{t("invitedBy", { name: invite.created_by_name })}</p>
                <p className="mt-2">
                  {getInviteStatusLabel(invite.status, locale)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {invite && (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-4 text-sm dark:border-white/10 dark:bg-card/70">
                <div className="flex items-center gap-2 font-medium text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  {t("invitedBy", { name: invite.created_by_name })}
                </div>
                {invite.note && (
                  <p className="mt-3 text-muted-foreground">{invite.note}</p>
                )}
                <p className="mt-3 text-muted-foreground">
                  {t("inviteExpiresOn", {
                    date: formatDate(invite.expires_at, locale),
                  })}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="join-name" className="text-base">
                {t("joinNameLabel")}
              </Label>
              <Input
                id="join-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("joinNamePlaceholder")}
                className="h-14 rounded-2xl bg-white/80 text-base shadow-sm dark:bg-card/80"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-pin" className="text-base">
                {t("pinLabel")}
              </Label>
              <Input
                id="join-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={t("pinPlaceholder")}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="h-14 rounded-2xl border-white/70 bg-white/80 text-center text-2xl tracking-[0.5em] font-mono shadow-sm dark:border-white/10 dark:bg-card/80"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-pin-confirm" className="text-base">
                {t("confirmPinLabel")}
              </Label>
              <Input
                id="join-pin-confirm"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={t("pinPlaceholder")}
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, ""))
                }
                className="h-14 rounded-2xl border-white/70 bg-white/80 text-center text-2xl tracking-[0.5em] font-mono shadow-sm dark:border-white/10 dark:bg-card/80"
              />
            </div>

            {errorKey && (
              <p className="text-center text-sm font-medium text-destructive">
                {t(errorKey)}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-2xl text-lg font-semibold shadow-lg shadow-primary/20"
            >
              {isSubmitting ? t("joiningInvite") : t("inviteJoin")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
