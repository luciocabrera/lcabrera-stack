import type { TableColumn } from '../Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';

export const resolveColumnStartWidth = <TData>({
  minWidth,
  width,
}: Pick<TableColumn<TData>, 'minWidth' | 'width'>) => {
  const effectiveMinWidth = minWidth ?? DEFAULT_MIN_COLUMN_WIDTH;

  return typeof width === 'number'
    ? Math.max(width, effectiveMinWidth)
    : effectiveMinWidth;
};
