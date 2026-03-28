import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/worker/", "/agency/", "/admin/", "/api/", "/onboarding"],
    },
    sitemap: "https://shiftcare-app-rho.vercel.app/sitemap.xml",
  };
}
