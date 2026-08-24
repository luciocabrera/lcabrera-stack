import { useGetTableColumnShare } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import type { TableGroupShareProps } from './TableGroupShare.types';

import { TableGroupShareValue } from './TableGroupShareValue';

/**
 * A self-connected delegate: it answers "is a share asked of this aggregate" from the
 * grouping store itself, so `TableGroupAggregate` renders it unconditionally and forwards
 * only the identity and the value it already holds.
 * It does nothing but that check, and the split is deliberate — deriving the denominator
 * is a fold over every row, and a hook cannot be called conditionally, so the work lives
 * in `TableGroupShareValue` where it is only mounted for a measure that is actually
 * showing a share (#648).
 */
export const TableGroupShare = ({
  columnKey,
  fn,
  value,
}: TableGroupShareProps) => {
  const isShared = useGetTableColumnShare({ columnKey, fn });

  if (!isShared) return;

  return <TableGroupShareValue columnKey={columnKey} fn={fn} value={value} />;
};
