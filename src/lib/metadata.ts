import type { Metadata } from "next";
import { localeStorageKey, type Locale } from "./i18n";

type CookieStoreLike = {
  get(name: string): { value?: string } | undefined;
};

const defaultSiteUrl = "https://fixlogapp.netlify.app";

const seoCopy = {
  ar: {
    appName: "فيكس لوغ",
    siteTitle: "فيكس لوغ | سجل صيانة الأعطال للمصانع",
    siteDescription:
      "فيكس لوغ تطبيق ويب تقدمي يعمل بدون اتصال لتسجيل الأعطال والصيانة في المصانع، مع مزامنة لاحقة، سجل نشاط تفصيلي، ودعم كامل للغة العربية.",
    loginTitle: "تسجيل الدخول | فيكس لوغ",
    loginDescription:
      "ادخل إلى فيكس لوغ لإدارة بلاغات الأعطال، متابعة الإصلاحات، ومزامنة سجلات الصيانة بين الأجهزة.",
    appTitle: "لوحة الصيانة | فيكس لوغ",
    appDescription:
      "مساحة العمل الداخلية في فيكس لوغ لمتابعة الأعطال المفتوحة، تسجيل الإصلاحات، والاطلاع على سجل النشاط.",
    keywords: [
      "فيكس لوغ",
      "صيانة مصانع",
      "سجل أعطال",
      "إدارة الصيانة",
      "صيانة بدون اتصال",
      "تطبيق PWA",
      "بلاغات الأعطال",
      "سجل صيانة عربي",
    ],
    locale: "ar_SA",
  },
  en: {
    appName: "FixLog",
    siteTitle: "FixLog | Offline-First Factory Maintenance Logbook",
    siteDescription:
      "FixLog is an offline-first maintenance PWA for factory teams to log machine breakdowns, track repairs, sync across devices, and keep a detailed audit history.",
    loginTitle: "Login | FixLog",
    loginDescription:
      "Access FixLog to record machine breakdowns, track repair status, and sync maintenance activity across devices.",
    appTitle: "Maintenance Workspace | FixLog",
    appDescription:
      "The internal FixLog workspace for reviewing open maintenance logs, recording fixes, and browsing the repair history.",
    keywords: [
      "FixLog",
      "factory maintenance",
      "maintenance logbook",
      "machine breakdown tracking",
      "offline first PWA",
      "maintenance audit trail",
      "industrial maintenance app",
      "repair status tracking",
    ],
    locale: "en_US",
  },
} as const;

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL ?? defaultSiteUrl;

  if (
    configuredUrl.startsWith("http://") ||
    configuredUrl.startsWith("https://")
  ) {
    return configuredUrl;
  }

  return `https://${configuredUrl}`;
}

function getSeoCopy(locale: Locale) {
  return seoCopy[locale];
}

function getLanguageAlternates(pathname: string) {
  return {
    en: pathname,
    ar: pathname,
    "x-default": pathname,
  };
}

function buildSharedMetadata(locale: Locale, pathname: string): Metadata {
  const copy = getSeoCopy(locale);

  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: copy.appName,
    category: "technology",
    classification: "Industrial maintenance software",
    keywords: [...copy.keywords],
    alternates: {
      canonical: pathname,
      languages: getLanguageAlternates(pathname),
    },
    openGraph: {
      type: "website",
      locale: copy.locale,
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_SA"],
      siteName: copy.appName,
      images: [
        {
          url: "/icons/icon-512x512.png",
          width: 512,
          height: 512,
          alt: copy.appName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/icons/icon-512x512.png"],
    },
    other: {
      "content-language": locale,
      "apple-mobile-web-app-capable": "yes",
      "mobile-web-app-capable": "yes",
    },
  };
}

export function getRequestLocale(cookieStore: CookieStoreLike): Locale {
  return cookieStore.get(localeStorageKey)?.value === "en" ? "en" : "ar";
}

export function buildRootMetadata(locale: Locale): Metadata {
  const copy = getSeoCopy(locale);

  return {
    ...buildSharedMetadata(locale, "/"),
    title: {
      default: copy.siteTitle,
      template: locale === "ar" ? "%s | فيكس لوغ" : "%s | FixLog",
    },
    description: copy.siteDescription,
    openGraph: {
      ...buildSharedMetadata(locale, "/").openGraph,
      title: copy.siteTitle,
      description: copy.siteDescription,
      url: "/",
    },
    twitter: {
      ...buildSharedMetadata(locale, "/").twitter,
      title: copy.siteTitle,
      description: copy.siteDescription,
    },
  };
}

export function buildLoginMetadata(locale: Locale): Metadata {
  const copy = getSeoCopy(locale);

  return {
    ...buildSharedMetadata(locale, "/login"),
    title: copy.loginTitle,
    description: copy.loginDescription,
    openGraph: {
      ...buildSharedMetadata(locale, "/login").openGraph,
      title: copy.loginTitle,
      description: copy.loginDescription,
      url: "/login",
    },
    twitter: {
      ...buildSharedMetadata(locale, "/login").twitter,
      title: copy.loginTitle,
      description: copy.loginDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export function buildAppMetadata(locale: Locale): Metadata {
  const copy = getSeoCopy(locale);

  return {
    ...buildSharedMetadata(locale, "/"),
    title: copy.appTitle,
    description: copy.appDescription,
    openGraph: {
      ...buildSharedMetadata(locale, "/").openGraph,
      title: copy.appTitle,
      description: copy.appDescription,
      url: "/",
    },
    twitter: {
      ...buildSharedMetadata(locale, "/").twitter,
      title: copy.appTitle,
      description: copy.appDescription,
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export function getResolvedSiteUrl() {
  return getSiteUrl();
}
