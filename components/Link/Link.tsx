import clsx from "clsx";
import NextLink from "next/link";

export type LinkProps = {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function Link({ href, className, ...props }: LinkProps) {
  const isInternalLink = href && (href.startsWith("/") || href.startsWith("#"));
  const classNames = clsx("text-blue-500 underline", className);

  console.log("isInternalLink", isInternalLink);

  return isInternalLink ? (
    <NextLink href={href}>
      <a className={classNames} {...props} />
    </NextLink>
  ) : (
    <a
      className={classNames}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
}
