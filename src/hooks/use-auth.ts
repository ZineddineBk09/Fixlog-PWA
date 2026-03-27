"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";

export interface Mechanic {
  id: string;
  name: string;
}

export type AuthErrorKey =
  | "invalidNameOrPin"
  | "firstLoginNeedsInternet"
  | "offlinePinVerification"
  | "loginFailed";

const STORAGE_KEY = "fixlog_auth";

function getStoredAuth(): Mechanic | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Mechanic;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMechanic(getStoredAuth());
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (
      name: string,
      pin: string,
    ): Promise<{ success: boolean; errorKey?: AuthErrorKey }> => {
      try {
        // Try remote validation first
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from("mechanics")
            .select("id, name")
            .eq("name", name)
            .eq("pin_code", pin)
            .single();

          if (error || !data) {
            return { success: false, errorKey: "invalidNameOrPin" };
          }

          const auth: Mechanic = { id: data.id, name: data.name };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
          setMechanic(auth);
          return { success: true };
        }

        // Offline: check if we have cached mechanics
        const cached = await db.mechanics.toArray();
        if (cached.length === 0) {
          return {
            success: false,
            errorKey: "firstLoginNeedsInternet",
          };
        }

        return {
          success: false,
          errorKey: "offlinePinVerification",
        };
      } catch {
        return { success: false, errorKey: "loginFailed" };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMechanic(null);
  }, []);

  return {
    mechanic,
    isLoggedIn: !!mechanic,
    isLoading,
    login,
    logout,
  };
}
