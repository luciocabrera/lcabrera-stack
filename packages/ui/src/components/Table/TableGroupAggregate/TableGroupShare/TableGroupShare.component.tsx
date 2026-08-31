import { useGetTableColumnShare } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import type { TableGroupShareProps } from './TableGroupShare.types';

import { TableGroupShareValue } from './TableGroupShareValue';

export const TableGroupShare = ({
  columnKey,
  fn,
  value,
}: TableGroupShareProps) => {
  const isShared = useGetTableColumnShare({ columnKey, fn });

  if (!isShared) return;

  return <TableGroupShareValue columnKey={columnKey} fn={fn} value={value} />;
};
