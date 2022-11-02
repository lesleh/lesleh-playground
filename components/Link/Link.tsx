import clsx from "clsx";
import NextLink from "next/link";
import type { ComponentProps } from "react";
import { LinkProps } from "./types";

function isInternalLink(href: ComponentProps<typeof NextLink>["href"]) {
  return typeof href === "string" && href.startsWith("/");
}

export function Link({ href, className, ...props }: LinkProps) {
  const classNames = clsx("text-blue-500 underline", className);

  return isInternalLink(href) ? (
    <NextLink href={href} className={classNames} {...props} />
  ) : (
    <a href={href.toString()} className={classNames} {...props} />
  );
}
