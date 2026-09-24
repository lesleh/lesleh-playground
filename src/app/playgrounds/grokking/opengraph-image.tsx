import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Grokking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Grokking",
  "A neural network memorises modular addition, then, thousands of steps later, suddenly generalises.",
);
