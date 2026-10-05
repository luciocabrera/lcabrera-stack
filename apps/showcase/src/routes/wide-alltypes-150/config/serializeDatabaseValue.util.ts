import { toHexString } from './toHexString.util';

export const serializeDatabaseValue = (value: unknown): unknown => {
  if (value instanceof Uint8Array) {
    return toHexString(value);
  }

  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? JSON.stringify(value)
    : value;
};
