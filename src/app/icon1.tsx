import { ImageResponse } from "next/og";
import { OgLogoTree } from "@/lib/og-logo";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

// 192×192 — minimum size required by PWA spec for `add to home screen` on Android.
export default function Icon192() {
  return new ImageResponse(<OgLogoTree size={192} padded />, { ...size });
}
