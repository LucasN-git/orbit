import { ImageResponse } from "next/og";
import { OgLogoTree } from "@/lib/og-logo";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<OgLogoTree size={512} />, { ...size });
}
