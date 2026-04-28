import { ImageResponse } from "next/og";
import { OgLogoTree } from "@/lib/og-logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch-icon: iOS applies its own rounded squircle mask, so render flush.
export default function AppleIcon() {
  return new ImageResponse(<OgLogoTree size={180} flush />, { ...size });
}
