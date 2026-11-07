import type { TableColumnAlign } from '#ui/components/Table/Table.types';
import type { TableStaticColumnWidths } from '#ui/components/Table/utils/resolveStaticColumnWidths.util';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

const ALIGN_STYLES = {
  center: tableBodyCellStyles.alignCenter,
  end: tableBodyCellStyles.alignRight,
  start: tableBodyCellStyles.alignStart,
} as const;

type ResolveCellLayoutStylesArgs = {
  readonly align?: TableColumnAlign;
  readonly isFill?: boolean;
  readonly staticWidths?: TableStaticColumnWidths;
};

export const resolveCellLayoutStyles = ({
  align,
  isFill,
  staticWidths,
}: ResolveCellLayoutStylesArgs) => [
  ...(staticWidths === undefined
    ? []
    : [tableBodyCellStyles.staticLayout(staticWidths)]),
  ...(align === undefined ? [] : [ALIGN_STYLES[align]]),
  ...(isFill === true ? [tableBodyCellStyles.fill] : []),
];
