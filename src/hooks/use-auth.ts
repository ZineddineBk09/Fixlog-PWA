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

function persistAuth(mechanic: Mechanic) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mechanic));
}

export function useAuth() {
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authenticate = useCallback((nextMechanic: Mechanic) => {
    persistAuth(nextMechanic);
    setMechanic(nextMechanic);
  }, []);

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
          const { data, error } = await supabase.rpc(
            "validate_mechanic_login",
            {
              p_name: name,
              p_pin: pin,
            },
          );

          const account = Array.isArray(data) ? data[0] : data;

          if (error || !account) {
            return { success: false, errorKey: "invalidNameOrPin" };
          }

          const auth: Mechanic = { id: account.id, name: account.name };
          persistAuth(auth);
          setMechanic(auth);
          await db.mechanics.put(auth);
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
    authenticate,
    login,
    logout,
  };
}
