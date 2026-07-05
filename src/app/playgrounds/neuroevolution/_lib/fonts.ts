import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";

// Chakra Petch: squared, technical, lap-timer energy for the big readouts and
// headings — the pit-wall display voice.
export const display = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-neuro-display",
  display: "swap",
});

// IBM Plex Mono: engineering-instrument heritage for the dense labels and data.
export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-neuro-mono",
  display: "swap",
});
