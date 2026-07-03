import type { MetadataRoute } from "next";

const SITE_URL = "https://bvb.differentialfactor.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Saved reports are private, per-user artifacts — keep them out of the index.
      disallow: ["/api/", "/report/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
