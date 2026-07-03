import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Echo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Echo",
  "Watch the pattern of colours and tones, then tap it back. It grows every round.",
);
