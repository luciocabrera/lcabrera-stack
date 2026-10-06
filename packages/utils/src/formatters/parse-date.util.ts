export const parseDate = (value: unknown) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== 'string' && typeof value !== 'number') {
    return;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
