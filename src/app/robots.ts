import type { MetadataRoute } from "next";
import { getResolvedSiteUrl } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getResolvedSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/login", "/favicon.svg", "/icons/", "/manifest.webmanifest"],
      disallow: ["/new", "/pending", "/invite", "/join/", "/log/", "/~offline"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
