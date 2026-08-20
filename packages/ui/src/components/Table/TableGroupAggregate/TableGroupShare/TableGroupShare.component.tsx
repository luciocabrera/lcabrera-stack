import { useGetTableColumnShare } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import type { TableGroupShareProps } from './TableGroupShare.types';

import { TableGroupShareValue } from './TableGroupShareValue';

/**
 * One measure as a share of the grand total, when the column asked for one.
 *
 * A self-connected delegate: it answers "is a share asked of this column" from
 * the grouping store itself, so `TableGroupAggregate` renders it
 * unconditionally and forwards only the value it already holds.
 *
 * It does nothing but that check, and the split is deliberate — deriving the
 * denominator is a fold over every row, and a hook cannot be called
 * conditionally, so the work lives in `TableGroupShareValue` where it is only
 * mounted for a column that is actually showing a share (#648).
 */
export const TableGroupShare = ({ columnKey, value }: TableGroupShareProps) => {
  const isShared = useGetTableColumnShare(columnKey);

  if (!isShared) return;

  return <TableGroupShareValue columnKey={columnKey} value={value} />;
};
