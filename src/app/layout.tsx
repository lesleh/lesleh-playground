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
      </head>
      <body className="h-full flex flex-col">
        <div className="px-4 pt-2 pb-1 shrink-0">
          <Breadcrumbs />
        </div>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
