import { ImageResponse } from "next/og";

export function createOgImage(title: string, description: string) {
  return async function OgImage() {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 80px",
            backgroundColor: "#fffef5",
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: "rgba(0,0,0,0.4)",
                fontFamily: "monospace",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              lesleh · playground
            </div>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#000",
                lineHeight: 1.1,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 28,
                color: "rgba(0,0,0,0.5)",
                lineHeight: 1.4,
                maxWidth: "80%",
              }}
            >
              {description}
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 60,
              right: 80,
              display: "flex",
              gap: "4px",
            }}
          >
            <div style={{ width: 8, height: 8, backgroundColor: "#000" }} />
            <div style={{ width: 32, height: 8, backgroundColor: "#000" }} />
            <div style={{ flex: 1, width: 120, height: 8, backgroundColor: "#000" }} />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  };
}
