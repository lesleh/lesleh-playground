import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Whack-a-Mole";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Whack-a-Mole",
  "Bonk the moles before they duck away. They get faster and faster.",
);
