"use client";

import { SerwistProvider as BaseSerwistProvider } from "@serwist/next/react";
import { createElement, useEffect, useState, type ReactNode } from "react";

function canRegisterServiceWorker() {
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV !== "production") return false;
  if (!("serviceWorker" in navigator)) return false;

  return (
    window.isSecureContext ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function SerwistProvider({
  children,
  swUrl,
}: {
  children: ReactNode;
  swUrl: string;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(canRegisterServiceWorker());
  }, []);

  if (!enabled) {
    return children;
  }

  return createElement(BaseSerwistProvider, { swUrl }, children);
}
