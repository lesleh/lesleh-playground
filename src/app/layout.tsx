/* eslint-disable @next/next/no-page-custom-font */
import "../styles/globals.css";
import { Breadcrumbs } from "./_components/Breadcrumbs";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="h-full">
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Quattrocento:wght@700&family=Source+Sans+Pro:ital@0;1&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full grid grid-cols-1 grid-rows-[auto,1fr">
        <div className="px-4 pt-2 pb-1">
          <Breadcrumbs />
        </div>
        <div>{children}</div>
      </body>
    </html>
  );
}
