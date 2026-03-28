import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Home Care for Your Loved Ones | ShiftCare";
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
            "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, marginBottom: 16 }}>
          Home Care for Your Loved Ones
        </div>
        <div style={{ fontSize: 32, opacity: 0.9 }}>
          Verified Caregivers &middot; No Contracts
        </div>
        <div style={{ fontSize: 20, opacity: 0.7, marginTop: 24 }}>
          ShiftCare &mdash; Trusted Home Healthcare
        </div>
      </div>
    ),
    { ...size }
  );
}
