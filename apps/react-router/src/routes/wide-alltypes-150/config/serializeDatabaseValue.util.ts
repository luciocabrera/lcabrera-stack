import { toHexString } from './toHexString.util';

/**
 * That is deliberately preserved rather than corrected: the columns are labelled by their
 * Postgres type and this is what every page of this table has rendered.
 */
export const serializeDatabaseValue = (value: unknown): unknown => {
  if (value instanceof Uint8Array) {
    return toHexString(value);
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return value;
};
