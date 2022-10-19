import clsx from "clsx";
import { ParagraphProps } from "./types";

export function Paragraph({ children, className }: ParagraphProps) {
  return (
    <p className={clsx("font-source-sans-pro text-lg my-3", className)}>
      {children}
    </p>
  );
}
