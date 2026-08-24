import type { ColumnPinningState } from '#ui/components/Table/Table.types';

export const getDefaultColumnPinning = (
  pinning: ColumnPinningState | undefined,
) => pinning ?? { left: [], right: [] };
