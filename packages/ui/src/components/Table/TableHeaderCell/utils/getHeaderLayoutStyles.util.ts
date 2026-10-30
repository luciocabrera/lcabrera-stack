import type {
  PinnedColumnInfo,
  TableColumn,
  TableLayoutMode,
} from '#ui/components/Table/Table.types';

import { resolveStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';

type GetHeaderLayoutStylesArgs<TData> = {
  readonly column: Pick<
    TableColumn<TData>,
    'align' | 'maxWidth' | 'minWidth' | 'width'
  >;
  readonly isSized: boolean;
  readonly layout: TableLayoutMode;
  readonly pinInfo?: PinnedColumnInfo;
};

const CELL_ALIGN_STYLES = {
  center: tableHeaderCellStyles.alignCenter,
  end: tableHeaderCellStyles.alignEnd,
  start: tableHeaderCellStyles.alignStart,
} as const;

const LABEL_ALIGN_STYLES = {
  center: tableHeaderCellStyles.contentAlignCenter,
  end: tableHeaderCellStyles.contentAlignEnd,
  start: undefined,
} as const;

const resolveSizeStyle = <TData>({
  column,
  isSized,
  layout,
  pinInfo,
}: GetHeaderLayoutStylesArgs<TData>) => {
  if (layout === 'static')
    return tableHeaderCellStyles.staticLayout(
      resolveStaticColumnWidths(column),
    );

  const isFill = column.width === 'fill' && !isSized && pinInfo === undefined;

  return isFill ? tableHeaderCellStyles.fill : undefined;
};

export const getHeaderLayoutStyles = <TData>(
  args: GetHeaderLayoutStylesArgs<TData>,
) => {
  const { align } = args.column;

  return {
    cell: [
      resolveSizeStyle(args),
      ...(align === undefined ? [] : [CELL_ALIGN_STYLES[align]]),
    ],
    label: align === undefined ? [] : [LABEL_ALIGN_STYLES[align]],
  };
};
