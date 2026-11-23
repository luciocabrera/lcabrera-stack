import type { TableColumn } from '../Table.types';

import { resolveColumnMinWidth } from './resolveColumnMinWidth.util';

export const resolveColumnStartWidth = <TData>({
  maxWidth,
  minWidth,
  width,
}: Pick<TableColumn<TData>, 'maxWidth' | 'minWidth' | 'width'>) => {
  const effectiveMinWidth = resolveColumnMinWidth({ maxWidth, minWidth });

  return typeof width === 'number'
    ? Math.max(width, effectiveMinWidth)
    : effectiveMinWidth;
};
