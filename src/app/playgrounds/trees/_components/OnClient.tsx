"use client";

import { Box } from "./Box";

export function OnClient({ children }: { children?: React.ReactNode }) {
  return <Box color="red">{children}</Box>;
}
