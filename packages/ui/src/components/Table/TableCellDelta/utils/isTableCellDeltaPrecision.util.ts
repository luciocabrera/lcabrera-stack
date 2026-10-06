const MAX_FRACTION_DIGITS = 20;

export const isTableCellDeltaPrecision = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isSafeInteger(value) &&
  value >= 0 &&
  value <= MAX_FRACTION_DIGITS;
