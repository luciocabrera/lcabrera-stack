/**
 * Map a set of enum string values to the `{ label, value }` option shape the
 * Form's select/radio fields expect. Label and value are identical (the enum
 * value is already human-readable).
 */
export const toFieldOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }));
