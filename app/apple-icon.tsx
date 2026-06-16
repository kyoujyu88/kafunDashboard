import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 60%, #0e7490 100%)",
          color: "#fff",
          letterSpacing: -2,
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1 }}>K</div>
        <div style={{ fontSize: 18, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>
          KafunAir
        </div>
      </div>
    ),
    { ...size }
  );
}
