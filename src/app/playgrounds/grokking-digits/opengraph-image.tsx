import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Grokking Digits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Grokking Digits",
  "A neural network memorises handwritten digits, stalls, then suddenly reads ones it has never seen.",
);
