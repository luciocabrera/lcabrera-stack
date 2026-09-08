import type { TableColumn } from '../Table.types';

import { resolveDeclaredGroupingKeys } from './resolveDeclaredGroupingKeys.util';
import { resolveGroupedColumnWidthBand } from './resolveGroupedColumnWidthBand.util';

type WithGroupedColumnWidthsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly groupingKeys: readonly string[];
};

export const withGroupedColumnWidths = <TData>({
  columns,
  groupingKeys,
}: WithGroupedColumnWidthsArgs<TData>) => {
  const keys = resolveDeclaredGroupingKeys({ columns, groupingKeys });

  if (keys.length === 0) return columns;

  const { maxWidth, minWidth } = resolveGroupedColumnWidthBand();

  return columns.map((column) => ({ ...column, maxWidth, minWidth }));
};
