import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Trees";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Trees",
  "A tree of nested server and client components, demonstrating App Router composition."
);
