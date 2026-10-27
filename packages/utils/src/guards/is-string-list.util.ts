export const isStringList = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
