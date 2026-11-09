import type {
  PinnedColumnInfo,
  TableColumn,
  TableLayoutMode,
} from '#ui/components/Table/Table.types';

import { NUMERIC_DATA_TYPES } from '#ui/components/Table/TableBodyCell/utils/resolveCellNumericStyles.util';
import { resolveStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

type ResolveCellLayoutArgs<TData> = {
  readonly col: Pick<
    TableColumn<TData>,
    'align' | 'dataType' | 'maxWidth' | 'minWidth' | 'width'
  >;
  readonly layout?: TableLayoutMode;
  readonly pinInfo?: PinnedColumnInfo;
  readonly sizedWidth?: number;
};

export const resolveCellLayout = <TData>({
  col,
  layout,
  pinInfo,
  sizedWidth,
}: ResolveCellLayoutArgs<TData>) => {
  const isNumeric = NUMERIC_DATA_TYPES.has(col.dataType) || undefined;

  if (layout === 'static')
    return {
      align: col.align,
      isFill: undefined,
      isNumeric,
      staticWidths: resolveStaticColumnWidths({
        ...col,
        isPinned: pinInfo !== undefined,
        sizedWidth,
      }),
    };

  const isFill =
    col.width === 'fill' && sizedWidth === undefined && pinInfo === undefined;

  return {
    align: col.align,
    isFill: isFill || undefined,
    isNumeric,
    staticWidths: undefined,
  };
};
