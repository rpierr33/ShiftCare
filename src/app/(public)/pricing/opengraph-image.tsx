import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Simple Pricing | ShiftCare";
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
            "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #22d3ee 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 16 }}>
          Simple Pricing
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Workers Always Free &middot; Plans from $0/mo
        </div>
        <div style={{ fontSize: 20, opacity: 0.7, marginTop: 24 }}>
          ShiftCare &mdash; Fill Healthcare Shifts Fast
        </div>
      </div>
    ),
    { ...size }
  );
}
