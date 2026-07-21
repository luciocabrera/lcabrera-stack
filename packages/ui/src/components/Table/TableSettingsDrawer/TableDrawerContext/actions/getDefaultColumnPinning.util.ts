import type { ColumnPinningState } from '@lcabrera/ui/components/Table/Table.types';

/** Returns the table's current column pinning, or the empty default when none is set. */
export const getDefaultColumnPinning = (
  pinning: ColumnPinningState | undefined,
) => pinning ?? { left: [], right: [] };
