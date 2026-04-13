import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Lights Out";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage("Lights Out", "Toggle lights to clear the grid. Or let the auto-solver handle it.");
