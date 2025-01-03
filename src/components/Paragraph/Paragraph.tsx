import { twMerge } from "tailwind-merge";
import { ParagraphProps } from "./types";

export function Paragraph({ children, className }: ParagraphProps) {
  return (
    <p className={twMerge("font-source-sans-pro text-lg my-3", className)}>
      {children}
    </p>
  );
}
