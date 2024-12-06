import { Box } from "./Box";

export function OnServer({ children }: { children?: React.ReactNode }) {
  return <Box color="blue">{children}</Box>;
}
