import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Boids";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage("Boids", "700 agents follow three simple rules and emergent murmurations appear.");
