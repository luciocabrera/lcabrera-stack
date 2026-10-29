export const toCellText = (value: unknown) => {
  if (typeof value === 'string') return value;
  if ((value ?? undefined) === undefined) return '';
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  return value instanceof Date
    ? value.toISOString()
    : (JSON.stringify(value) ?? '');
};
