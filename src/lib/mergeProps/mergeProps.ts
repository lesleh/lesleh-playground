type Props = Record<string, any>;

export function mergeProps<T extends Props, U extends Props>(
  props: T,
  defaultProps: U
): T & U {
  const result: Props = { ...defaultProps };

  for (const key in props) {
    const propsValue = props[key];
    const defaultValue = defaultProps[key];

    // Merge className/class
    if (
      (key === "className" || key === "class") &&
      typeof propsValue === "string" &&
      typeof defaultValue === "string"
    ) {
      result[key] = `${defaultValue} ${propsValue}`.trim();
      continue;
    }

    // Merge style objects
    if (
      key === "style" &&
      typeof propsValue === "object" &&
      typeof defaultValue === "object" &&
      propsValue !== null &&
      defaultValue !== null
    ) {
      result[key] = { ...defaultValue, ...propsValue };
      continue;
    }

    // Merge event handlers (functions starting with 'on')
    if (
      key.startsWith("on") &&
      typeof propsValue === "function" &&
      typeof defaultValue === "function"
    ) {
      result[key] = (...args: any[]) => {
        defaultValue(...args);
        propsValue(...args);
      };
      continue;
    }

    // Merge ARIA attributes (objects like aria-* that are objects)
    if (
      key.startsWith("aria-") &&
      typeof propsValue === "object" &&
      typeof defaultValue === "object" &&
      propsValue !== null &&
      defaultValue !== null
    ) {
      result[key] = { ...defaultValue, ...propsValue };
      continue;
    }

    // For id and everything else, props wins (last-wins)
    result[key] = propsValue;
  }

  return result as T & U;
}
