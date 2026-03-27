import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { SyncProvider } from "@/providers/sync-provider";
import { SerwistProvider } from "./serwist";
import "./globals.css";
import { buildRootMetadata, getRequestLocale } from "@/lib/metadata";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = getRequestLocale(cookieStore);
  const metadata = buildRootMetadata(locale);

  return {
    ...metadata,
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/favicon.svg",
      apple: "/icons/icon-192x192.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: locale === "ar" ? "فيكس لوغ" : "FixLog",
    },
    formatDetection: {
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = getRequestLocale(cookieStore);

  return (
    <html
      lang={initialLocale}
      dir={initialLocale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable}`}
    >
      <body className="min-h-dvh flex flex-col antialiased">
        <SerwistProvider swUrl="/sw.js">
          <LocaleProvider initialLocale={initialLocale}>
            <AuthProvider>
              <SyncProvider>
                {children}
                <Toaster position="top-center" richColors closeButton />
              </SyncProvider>
            </AuthProvider>
          </LocaleProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
