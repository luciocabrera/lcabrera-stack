import type { ResolveHeaderSizeStyleArgs } from './resolveHeaderSizeStyle.util';

import { tableHeaderCellStyles } from '../TableHeaderCell.stylex';
import { resolveHeaderSizeStyle } from './resolveHeaderSizeStyle.util';

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

export const getHeaderLayoutStyles = <TData>(
  args: ResolveHeaderSizeStyleArgs<TData>,
) => {
  const { align } = args.column;

  return {
    cell: [
      resolveHeaderSizeStyle(args),
      ...(align === undefined ? [] : [CELL_ALIGN_STYLES[align]]),
    ],
    label: align === undefined ? [] : [LABEL_ALIGN_STYLES[align]],
  };
};
