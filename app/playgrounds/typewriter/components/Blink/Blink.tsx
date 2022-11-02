import clsx from "clsx";
import { BlinkProps } from "./types";

export function Blink({ children, className }: BlinkProps) {
  return <span className={clsx("animate-blink", className)}>{children}</span>;
}
