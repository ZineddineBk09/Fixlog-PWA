import type { Metadata } from "next";
import { cookies } from "next/headers";
import { buildLoginMetadata, getRequestLocale } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  return buildLoginMetadata(getRequestLocale(cookieStore));
}

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
