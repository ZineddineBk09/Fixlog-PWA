"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth, type AuthErrorKey, type Mechanic } from "@/hooks/use-auth";

interface AuthContextValue {
  mechanic: Mechanic | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (
    name: string,
    pin: string,
  ) => Promise<{ success: boolean; errorKey?: AuthErrorKey }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
