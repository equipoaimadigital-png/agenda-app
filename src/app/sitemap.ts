import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const professionals = await prisma.professional.findMany({
    where: { subscriptionStatus: { in: ["TRIAL", "ACTIVE"] } },
    select: { slug: true, updatedAt: true },
  });

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
    ...professionals.map((p) => ({
      url: `${base}/reservar/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
