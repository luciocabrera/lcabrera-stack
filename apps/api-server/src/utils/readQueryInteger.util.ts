import { readQueryValue } from "./readQueryValue.util";

type ReadQueryIntegerArgs = {
  readonly fallback: number;
  readonly max?: number;
  readonly min?: number;
  readonly value: unknown;
};

/**
 * Parse an integer query param with fallback and clamp support.
 */
export const readQueryInteger = ({
  fallback,
  max,
  min = 0,
  value,
}: ReadQueryIntegerArgs): number => {
  const normalizedValue = readQueryValue(value);

  if (!normalizedValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  const boundedValue = Math.max(min, parsedValue);

  if (max === undefined) {
    return boundedValue;
  }

  return Math.min(boundedValue, max);
};
