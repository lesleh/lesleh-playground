import clsx from "clsx";

export function Paragraph({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={clsx("font-source-sans-pro text-lg my-3", className)}>
      {children}
    </p>
  );
}
