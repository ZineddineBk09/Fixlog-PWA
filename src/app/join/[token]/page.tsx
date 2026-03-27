import type { Metadata } from "next";
import { cookies } from "next/headers";
import { buildRootMetadata, getRequestLocale } from "@/lib/metadata";
import { JoinInviteClient } from "./join-invite-client";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = getRequestLocale(cookieStore);
  const metadata = buildRootMetadata(locale);

  return {
    ...metadata,
    title: locale === "ar" ? "الانضمام إلى فيكس لوغ" : "Join FixLog",
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function JoinInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JoinInviteClient token={token} />;
}
