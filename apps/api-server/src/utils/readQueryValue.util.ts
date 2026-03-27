/**
 * Normalize an Express query value down to a single string when present.
 */
export const readQueryValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : undefined;
  }

  return undefined;
};
