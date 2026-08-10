import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const professional = await prisma.professional.findUnique({
    where: { slug },
    select: { businessName: true, brandColor: true },
  });

  const initial = (professional?.businessName ?? "T").trim().slice(0, 1).toUpperCase();
  const color = professional?.brandColor ?? "#2f4a3e";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: color,
          color: "white",
          fontSize: 280,
          fontWeight: 600,
          fontFamily: "Georgia, serif",
        }}
      >
        {initial}
      </div>
    ),
    { width: 512, height: 512 }
  );
}
