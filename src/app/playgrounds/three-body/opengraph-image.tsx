import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Three Body Problem";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Three Body Problem",
  "Three gravitating stars. Tweak masses and starting velocities to summon stable dances or chaos."
);
