export const toFieldOptions = (values: readonly string[]) =>
  values.map((value) => ({ label: value, value }));
