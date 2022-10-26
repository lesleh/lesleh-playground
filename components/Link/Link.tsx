import clsx from "clsx";
import NextLink from "next/link";
import { LinkProps } from "./types";

export function Link({ href, className, ...props }: LinkProps) {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));
  const classNames = clsx("text-blue-500 underline", className);

  const Component = isInternalLink ? NextLink : "a";

  return (
    <Component
      className={classNames}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}
