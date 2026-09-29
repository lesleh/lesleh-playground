import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Learning Digits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Learning Digits",
  "A neural network memorises handwritten digits, stalls, then improves on ones it has never seen.",
);
