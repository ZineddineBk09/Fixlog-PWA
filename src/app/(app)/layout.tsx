import type { Metadata } from "next";
import { cookies } from "next/headers";
import { buildAppMetadata, getRequestLocale } from "@/lib/metadata";
import { AppShell } from "./app-shell";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  return buildAppMetadata(getRequestLocale(cookieStore));
}

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
