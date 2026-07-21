import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import type { PinSide } from '../ColumnOrderSection.types';

type ResolveClosestEdgeSideArgs<TData> = {
  readonly allOrderedColumns: readonly TableColumn<TData>[];
  readonly columnKey: string;
  readonly pinSide: PinSide;
};

/**
 * Resolves a PinSide value to an actual 'left' | 'right' side.
 * If 'closest-edge', determines side based on column position relative to the midpoint.
 */
export const resolveClosestEdgeSide = <TData>({
  allOrderedColumns,
  columnKey,
  pinSide,
}: ResolveClosestEdgeSideArgs<TData>): 'left' | 'right' => {
  if (pinSide !== 'closest-edge') return pinSide;
  const index = allOrderedColumns.findIndex((col) => col.key === columnKey);
  const midpoint = Math.floor(allOrderedColumns.length / 2);
  return index < midpoint ? 'left' : 'right';
};
