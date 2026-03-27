"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/providers/auth-provider";
import { useLocale } from "@/providers/locale-provider";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Languages, Wrench } from "lucide-react";

interface MechanicOption {
  id: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuthContext();
  const { t, locale, toggleLocale } = useLocale();
  const cachedMechanics = useLiveQuery(
    async () => db.mechanics.orderBy("name").toArray(),
    [],
  );
  const [selectedName, setSelectedName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    async function fetchMechanics() {
      if (!navigator.onLine) return;
      try {
        const { data, error: fetchError } = await supabase
          .from("mechanics")
          .select("id, name")
          .order("name");

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          await db.mechanics.bulkPut(data);
          setLoadError("");
        }
      } catch {
        setLoadError(t("mechanicsFetchFailed"));
      }
    }
    fetchMechanics();
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedName) {
      setError(t("selectNameError"));
      return;
    }
    if (pin.length !== 4) {
      setError(t("pinMustBeFourDigits"));
      return;
    }

    setIsSubmitting(true);
    const result = await login(selectedName, pin);
    setIsSubmitting(false);

    if (!result.success) {
      setError(t(result.errorKey ?? "loginFailed"));
    } else {
      router.replace("/");
    }
  }

  const mechanics = cachedMechanics ?? [];

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_35%),linear-gradient(180deg,rgba(239,246,255,1),rgba(255,255,255,1))] px-6 dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_25%),linear-gradient(180deg,rgba(2,6,23,1),rgba(15,23,42,1))]">
      <div className="w-full max-w-sm space-y-8 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl"
            onClick={toggleLocale}
          >
            <Languages className="h-4 w-4" />
            {locale === "ar" ? t("switchToEnglish") : t("switchToArabic")}
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-18 w-18 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/25">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("loginTitle")}
          </h1>
          <p className="text-center text-muted-foreground">
            {t("loginSubtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {loadError && mechanics.length === 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
              {loadError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mechanic-name" className="text-base">
              {t("yourName")}
            </Label>
            <Select
              value={selectedName}
              onValueChange={(v) => setSelectedName(v ?? "")}
            >
              <SelectTrigger
                id="mechanic-name"
                className="h-14 rounded-2xl bg-white/80 text-base shadow-sm dark:bg-card/80"
              >
                <SelectValue placeholder={t("selectYourName")} />
              </SelectTrigger>
              <SelectContent>
                {mechanics.map((m) => (
                  <SelectItem
                    key={m.id}
                    value={m.name}
                    className="text-base py-3"
                  >
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin" className="text-base">
              {t("pinLabel")}
            </Label>
            <Input
              id="pin"
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

          {error && (
            <p className="text-destructive text-sm font-medium text-center">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-2xl text-lg font-semibold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? t("loggingIn") : t("logIn")}
          </Button>
        </form>
      </div>
    </div>
  );
}
