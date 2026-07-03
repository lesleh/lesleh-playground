import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Fowl Play";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Fowl Play",
  "Guide the chicken across the road, dodge the bikes and beat the clock.",
);
