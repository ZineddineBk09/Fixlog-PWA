import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/providers/auth-provider";
import { LocaleProvider } from "@/providers/locale-provider";
import { SyncProvider } from "@/providers/sync-provider";
import { SerwistProvider } from "./serwist";
import "./globals.css";
import { localeStorageKey, type Locale } from "@/lib/i18n";

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

export const metadata: Metadata = {
  applicationName: "FixLog",
  title: {
    default: "FixLog | فيكس لوغ",
    template: "%s | FixLog",
  },
  description:
    "Offline-first maintenance logbook for factory mechanics with Arabic support.",
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
    title: "FixLog",
  },
  formatDetection: {
    telephone: false,
  },
};

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
  const initialLocale = (
    cookieStore.get(localeStorageKey)?.value === "en" ? "en" : "ar"
  ) as Locale;

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
