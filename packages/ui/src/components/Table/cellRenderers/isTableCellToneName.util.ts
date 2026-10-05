export const isTableCellToneName = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';
