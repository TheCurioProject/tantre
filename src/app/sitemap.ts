import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/reservar/", "/privacidad/", "/terminos/"].map((route) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://tantre.mx"}${route}`,
    changeFrequency: "monthly",
    priority: route ? 0.5 : 1,
  }));
}
