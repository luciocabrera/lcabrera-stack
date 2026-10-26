export const isMissingCellValue = (value: unknown) =>
  value === '' || (value ?? undefined) === undefined;
