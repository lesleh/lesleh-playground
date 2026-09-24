import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

// Same instrument voice as the neuroevolution console (this playground reuses
// the shared .neuro-console styles). Kept local so the playground is
// self-contained; the CSS variable names match what those utilities expect.
export const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-neuro-display",
  display: "swap",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-neuro-mono",
  display: "swap",
});
