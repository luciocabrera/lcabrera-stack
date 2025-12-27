import * as stylex from '@stylexjs/stylex';

import type { TableCellProps } from './TableCell.types';

import { tableCellStyles } from './TableCell.stylex';

export const TableCell = ({
  align = 'left',
  children,
  customStylex,
  isHeader = false,
  isSticky = false,
  minWidth,
  width,
  ...rest
}: TableCellProps) => {
  const Tag = isHeader ? 'th' : 'td';
  return (
    <Tag
      style={{ minWidth, width }}
      {...rest}
      {...stylex.props(
        tableCellStyles.base,
        align === 'center' && tableCellStyles.alignCenter,
        align === 'right' && tableCellStyles.alignRight,
        isHeader && tableCellStyles.header,
        isHeader && isSticky && tableCellStyles.stickyHeader,
        customStylex,
      )}
    >
      {children}
    </Tag>
  );
};
