export function Box({
  children,
  color,
}: {
  children?: React.ReactNode;
  color?: "red" | "blue";
}) {
  return (
    <div
      className={`p-4 m-4 ${
        color === "blue"
          ? "border-blue-600 bg-blue-100"
          : "border-red-600 bg-red-100"
      } border-solid border-2`}
    >
      {children}
    </div>
  );
}
