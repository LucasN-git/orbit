import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f8f5ec",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: "50%",
            border: "16px solid #2b2722",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "#2b2722",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
