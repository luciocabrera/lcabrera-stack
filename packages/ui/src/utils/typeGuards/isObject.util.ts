/**
 * Narrow an unknown value to a plain object record.
 *
 * Shared building block for response-shape and payload guards — use it instead
 * of redeclaring the guard locally.
 * @param value - Value to test.
 * @returns True when the value is a non-null object.
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
