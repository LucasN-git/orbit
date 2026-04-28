import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "orbit",
    short_name: "orbit",
    description:
      "Wer von deinen Leuten gerade in deiner Stadt ist, wer mit dir reist, wer dich treffen will.",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f5ec",
    theme_color: "#f8f5ec",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
