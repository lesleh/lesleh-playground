import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Lottery Simulator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage(
  "Lottery Simulator",
  "Play the UK Lotto at £2 a ticket. Pick 6 from 59 and watch the house always win."
);
