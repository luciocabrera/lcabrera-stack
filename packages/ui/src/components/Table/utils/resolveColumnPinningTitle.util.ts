import type { TableColumnLayoutLock } from '#ui/components/Table/Table.types';

import { TABLE_COLUMN_LAYOUT_LOCK_LABELS } from '#ui/components/Table/Table.constants';

export const resolveColumnPinningTitle = (
  layoutLock: TableColumnLayoutLock | undefined,
) => {
  if (layoutLock === undefined) return;

  return layoutLock === 'group-key'
    ? `Cannot pin this column: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS['group-key']}.`
    : `Applies to the whole band: ${TABLE_COLUMN_LAYOUT_LOCK_LABELS.measure}.`;
};
