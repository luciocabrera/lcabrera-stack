/**
 * Parse a value into a Date object
 * Handles Date objects, ISO strings, and timestamps
 */
export const parseDate = (value: unknown) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    // Check if date is valid
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }
};
