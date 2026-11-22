import type {
  PinnedColumnInfo,
  TableColumn,
  TableLayoutMode,
} from '#ui/components/Table/Table.types';

import { resolveStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';

export type ResolveHeaderSizeStyleArgs<TData> = {
  readonly column: Pick<
    TableColumn<TData>,
    'align' | 'maxWidth' | 'minWidth' | 'width'
  >;
  readonly layout: TableLayoutMode;
  readonly pinInfo?: PinnedColumnInfo;
  readonly sizedWidth?: number;
};

export const resolveHeaderSizeStyle = <TData>({
  column,
  layout,
  pinInfo,
  sizedWidth,
}: ResolveHeaderSizeStyleArgs<TData>) => {
  if (layout === 'static')
    return tableHeaderCellStyles.staticLayout(
      resolveStaticColumnWidths({
        ...column,
        isPinned: pinInfo !== undefined,
        sizedWidth,
      }),
    );

  const isFill =
    column.width === 'fill' &&
    sizedWidth === undefined &&
    pinInfo === undefined;

  return isFill ? tableHeaderCellStyles.fill : undefined;
};
