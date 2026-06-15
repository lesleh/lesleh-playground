import { Fraunces, Spline_Sans_Mono } from "next/font/google";

// Fraunces: a high-contrast, slightly wonky display serif — old-money lottery
// glamour. opsz/SOFT/WONK axes let the big marquee headings turn theatrical.
export const display = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-display",
  display: "swap",
});

// Spline Sans Mono: the ticket-printer / ledger voice. Tabular, technical,
// quietly distinctive.
export const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
