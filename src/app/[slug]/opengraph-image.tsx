import { ImageResponse } from "next/og";
import { getPublicBusinessBySlug } from "@/server/services/business";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

type Params = { params: Promise<{ slug: string }> };

export default async function OpenGraphImage({ params }: Params) {
  const { slug } = await params;
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px",
            background: "linear-gradient(135deg, #0f172a 0%, #1664e8 100%)",
            color: "white",
          }}
        >
          <div style={{ fontSize: 34, opacity: 0.8 }}>Zorby</div>
          <div style={{ marginTop: 24, fontSize: 72, fontWeight: 700 }}>Agendamento online</div>
        </div>
      ),
      size,
    );
  }

  const location = [business.neighborhood, business.city].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background: `linear-gradient(135deg, ${business.brandPrimaryColor ?? "#1664e8"} 0%, ${business.brandSecondaryColor ?? "#1254c7"} 100%)`,
          color: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 30, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.86 }}>
            Zorby
          </div>
          <div
            style={{
              padding: "14px 20px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.16)",
              fontSize: 28,
            }}
          >
            Agendamento online
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: "900px" }}>
            {business.name}
          </div>
          <div style={{ fontSize: 28, opacity: 0.92, maxWidth: "920px", lineHeight: 1.4 }}>
            {business.description || "Veja horarios disponiveis em tempo real e confirme seu atendimento em poucos cliques."}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 24, opacity: 0.9 }}>
            {location || business.phone || "Agende com facilidade"}
          </div>
          <div style={{ fontSize: 24, opacity: 0.84 }}>/{business.slug}</div>
        </div>
      </div>
    ),
    size,
  );
}
