export function mergeProps<T extends object, U extends object>(
  props: T,
  defaultProps: U
): T & U {
  return { ...defaultProps, ...props };
}
