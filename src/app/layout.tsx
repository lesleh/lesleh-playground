/* eslint-disable @next/next/no-page-custom-font */
import "../styles/globals.css";
import { Breadcrumbs } from "./_components/Breadcrumbs";
import { Roboto_Slab } from "next/font/google";

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-roboto-slab",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={`h-full ${robotoSlab.variable}`}>
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="h-full grid grid-cols-1 grid-rows-[auto,1fr]">
        <div className="px-4 pt-2 pb-1">
          <Breadcrumbs />
        </div>
        <div>{children}</div>
      </body>
    </html>
  );
}
