import React from "react";
import { twMerge } from "tailwind-merge";
import { HeadingProps } from "./types";

const classNameMap = [
  null,
  "text-6xl my-8",
  "text-5xl my-6",
  "text-3xl my-4",
  "text-xl my-2",
  "text-md my-1",
  "text-sm my-0",
];

export function Heading({
  level,
  children,
  className,
}: HeadingProps): React.JSX.Element {
  const Component = `h${level}` as const;

  return (
    <Component
      className={twMerge("font-robotto-slab", classNameMap[level], className)}
    >
      {children}
    </Component>
  );
}
