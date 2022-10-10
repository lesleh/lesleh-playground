import clsx from "clsx";
import { useEffect, useState } from "react";

export function Blink({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={clsx("animate-blink", className)}>{children}</span>;
}
