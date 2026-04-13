import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Connect 4";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage("Connect 4", "Play Connect 4 against an AlphaZero-style AI trained via self-play.");
