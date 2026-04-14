/**
 * Convert PostgreSQL row values into JSON-safe response values.
 *
 * Handles Buffer serialization (hex encoding) and nested objects (JSON stringification).
 */
export const serializeDatabaseValue = (value: unknown): unknown => {
  if (Buffer.isBuffer(value)) {
    return value.toString('hex');
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return value;
};
