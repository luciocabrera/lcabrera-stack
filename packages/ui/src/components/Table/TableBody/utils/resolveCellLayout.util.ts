import type {
  PinnedColumnInfo,
  TableColumn,
  TableLayoutMode,
} from '#ui/components/Table/Table.types';

import { resolveStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

type ResolveCellLayoutArgs<TData> = {
  readonly col: Pick<
    TableColumn<TData>,
    'align' | 'maxWidth' | 'minWidth' | 'width'
  >;
  readonly isSized: boolean;
  readonly layout?: TableLayoutMode;
  readonly pinInfo?: PinnedColumnInfo;
};

export const resolveCellLayout = <TData>({
  col,
  isSized,
  layout,
  pinInfo,
}: ResolveCellLayoutArgs<TData>) => {
  if (layout === 'static')
    return {
      align: col.align,
      isFill: undefined,
      staticWidths: resolveStaticColumnWidths(col),
    };

  const isFill = col.width === 'fill' && !isSized && pinInfo === undefined;

  return {
    align: col.align,
    isFill: isFill || undefined,
    staticWidths: undefined,
  };
};
