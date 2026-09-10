export const toAxisHeaderLabel = (value: unknown) => {
  if (typeof value === 'string') return value;

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return '';
};
