export const stringifyLeafValue = (value: unknown) => {
  if (typeof value === 'string') {
    return value;
  }

  return typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : '';
};
