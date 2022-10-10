import clsx from "clsx";

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
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: React.ReactNode;
  className?: string;
}) {
  const Component = `h${level}` as const;

  return (
    <Component
      className={clsx(
        "font-quattrocento",
        "font-bold",
        classNameMap[level],
        className
      )}
    >
      {children}
    </Component>
  );
}
