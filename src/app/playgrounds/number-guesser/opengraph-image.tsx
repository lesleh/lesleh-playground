import { createOgImage } from "../_og/createOgImage";

export const runtime = "edge";
export const alt = "Number Guesser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default createOgImage("Number Guesser", "Classic number guessing game with hints. How few guesses does it take?");
