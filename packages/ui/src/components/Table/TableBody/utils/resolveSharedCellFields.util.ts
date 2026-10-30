import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
  TableLayoutMode,
} from '#ui/components/Table/Table.types';

import { DEFAULT_MIN_COLUMN_WIDTH } from '#ui/components/Table/Table.constants';
import { resolveColumnStartWidth } from '#ui/components/Table/utils/resolveColumnStartWidth.util';

import { resolveCellLayout } from './resolveCellLayout.util';

type ResolveSharedCellFieldsArgs<TData extends Record<string, unknown>> = {
  readonly col: TableColumn<TData>;
  readonly columnSizing: ColumnSizingState<TData>;
  readonly isLoadingState: boolean;
  readonly layout?: TableLayoutMode;
  readonly pinnedOffsets: Partial<Record<DataKey<TData>, PinnedColumnInfo>>;
  readonly rowIndex: number;
  readonly rowKey: string;
};

export const resolveSharedCellFields = <TData extends Record<string, unknown>>({
  col,
  columnSizing,
  isLoadingState,
  layout,
  pinnedOffsets,
  rowIndex,
  rowKey,
}: ResolveSharedCellFieldsArgs<TData>) => {
  const { key } = col;
  const sized = columnSizing[key];
  const pinInfo = pinnedOffsets[key];

  return {
    ...resolveCellLayout({
      col,
      isSized: sized !== undefined,
      layout,
      pinInfo,
    }),
    columnKey: key as string,
    isLoadingState,
    key,
    kind: 'custom',
    label: '',
    minWidth: col.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH,
    pinInfo,
    rowIndex,
    rowKey,
    width: sized ?? resolveColumnStartWidth(col),
  } as const;
};
