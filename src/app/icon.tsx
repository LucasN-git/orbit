import { ImageResponse } from "next/og";
import { OgLogoTree } from "@/lib/og-logo";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// padded=true → safe-zone for PWA `purpose: "any maskable"` (Android launcher mask).
export default function Icon() {
  return new ImageResponse(<OgLogoTree size={512} padded />, { ...size });
}
