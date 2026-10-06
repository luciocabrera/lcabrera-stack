const isNullish = (value: unknown) => value === null || value === undefined;

export const isEmptyCellValue = (value: unknown) =>
  isNullish(value) || value === '';
