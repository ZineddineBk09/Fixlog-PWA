import type { MetadataRoute } from "next";
import { getResolvedSiteUrl } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getResolvedSiteUrl();
  const lastModified = new Date();

  return [
    {
      url: `${siteUrl}/login`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: `${siteUrl}/login`,
          ar: `${siteUrl}/login`,
          "x-default": `${siteUrl}/login`,
        },
      },
    },
  ];
}
