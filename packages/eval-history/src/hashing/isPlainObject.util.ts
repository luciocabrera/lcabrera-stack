export const isPlainObject = (
  value: unknown,
): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' &&
  value !== null &&
  Object.getPrototypeOf(value) === Object.prototype;
