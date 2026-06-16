import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon192() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
          color: "#fff",
          fontWeight: 800,
          fontSize: 130,
          letterSpacing: -4,
          borderRadius: 36,
        }}
      >
        K
      </div>
    ),
    { ...size }
  );
}
