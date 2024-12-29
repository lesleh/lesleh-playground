"use client";

import { usePathname } from "next/navigation";
import { Link } from "../../../components/Link";
import { Fragment } from "react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const pathArray = pathname.split("/").filter((path) => path);

  return (
    <nav aria-label="breadcrumb">
      <ol>
        <li className="inline-block">
          {pathArray.length === 0 ? (
            <span>Home</span>
          ) : (
            <Link href="/">Home</Link>
          )}
        </li>
        {pathArray.map((path, index) => {
          const href = "/" + pathArray.slice(0, index + 1).join("/");
          const label = path.charAt(0).toUpperCase() + path.slice(1);
          const isLast = index === pathArray.length - 1;
          return (
            <Fragment key={path}>
              <span className="inline-block px-2">/</span>
              <li className="inline-block">
                {isLast ? (
                  <span>{label}</span>
                ) : (
                  <Link href={href}>{label}</Link>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
