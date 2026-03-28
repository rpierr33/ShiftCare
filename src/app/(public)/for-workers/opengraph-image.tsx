import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Healthcare Worker Jobs | ShiftCare";
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
            "linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 16 }}>
          Healthcare Worker Jobs
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Same Day Pay &middot; Flexible Shifts &middot; Florida
        </div>
        <div style={{ fontSize: 20, opacity: 0.7, marginTop: 24 }}>
          ShiftCare &mdash; Fill Healthcare Shifts Fast
        </div>
      </div>
    ),
    { ...size }
  );
}
