export const toComparableCellValue = (value: unknown) => {
  if (typeof value === 'number' || typeof value === 'bigint') return value;
  if (typeof value === 'boolean') return Number(value);
  if (value instanceof Date) return value.getTime();

  return typeof value === 'string' ? value : JSON.stringify(value);
};
