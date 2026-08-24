export const emptyToUndefined = (value: string): string | undefined =>
  value === '' ? undefined : value;
