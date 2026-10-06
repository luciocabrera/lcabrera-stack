export const isEmptyCellValue = (value: unknown) =>
  typeof value === 'string'
    ? value === ''
    : value === null || value === undefined;
