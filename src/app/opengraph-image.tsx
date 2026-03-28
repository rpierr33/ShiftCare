import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ShiftCare — Fill Healthcare Shifts Fast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 16 }}>
          ShiftCare
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Fill Healthcare Shifts Fast
        </div>
        <div style={{ fontSize: 20, opacity: 0.7, marginTop: 24 }}>
          Verified professionals. Same-day pay. No contracts.
        </div>
      </div>
    ),
    { ...size }
  );
}
