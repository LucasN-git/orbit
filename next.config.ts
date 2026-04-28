import type { NextConfig } from "next";

const ONE_YEAR_IMMUTABLE = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Generierte App-Icons + Manifest. Inhalt ändert sich praktisch nie;
      // bei Logo-Update reicht ein neuer Deploy → Browser-Cache wird durch
      // den geänderten Build-Hash ohnehin invalidiert.
      {
        source: "/icon",
        headers: [{ key: "Cache-Control", value: ONE_YEAR_IMMUTABLE }],
      },
      {
        source: "/icon1",
        headers: [{ key: "Cache-Control", value: ONE_YEAR_IMMUTABLE }],
      },
      {
        source: "/apple-icon",
        headers: [{ key: "Cache-Control", value: ONE_YEAR_IMMUTABLE }],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
