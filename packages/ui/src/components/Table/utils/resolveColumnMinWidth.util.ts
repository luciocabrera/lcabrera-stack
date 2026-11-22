import type { TableColumn } from '../Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';

export const resolveColumnMinWidth = <TData>({
  maxWidth,
  minWidth,
}: Pick<TableColumn<TData>, 'maxWidth' | 'minWidth'>) =>
  minWidth ??
  Math.min(DEFAULT_MIN_COLUMN_WIDTH, maxWidth ?? DEFAULT_MIN_COLUMN_WIDTH);
