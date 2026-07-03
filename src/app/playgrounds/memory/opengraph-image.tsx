import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Recall";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Recall",
  "A memory matching game. Flip cards, find the pairs, beat your best.",
);
