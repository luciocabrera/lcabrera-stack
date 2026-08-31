import { toHexString } from './toHexString.util';

export const serializeDatabaseValue = (value: unknown): unknown => {
  if (value instanceof Uint8Array) {
    return toHexString(value);
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return value;
};
