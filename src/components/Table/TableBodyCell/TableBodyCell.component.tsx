import * as stylex from '@stylexjs/stylex';

import type { TableBodyCellProps } from './TableBodyCell.types';

import { tableBodyCellStyles } from './TableBodyCell.stylex';
import { detectDataType, renderCellContent } from './utils';

export const TableBodyCell = ({
  customStylex,
  dataType: dataTypeProp,
  format,
  isLoading = false,
  label,
  locale,
  minWidth,
  value,
  width,
  ...rest
}: TableBodyCellProps) => {
  const dataType = dataTypeProp ?? detectDataType(value);

  const isRightAligned = dataType === 'number' || dataType === 'currency';
  const isCentered = dataType === 'boolean' || dataType === 'date';
  const hasEllipsis = dataType !== 'boolean';

  const content = renderCellContent({
    dataType,
    format,
    label,
    locale,
    value,
  });

  return (
    <td
      {...rest}
      {...stylex.props(
        tableBodyCellStyles.base(minWidth, width),
        isRightAligned && tableBodyCellStyles.alignRight,
        isCentered && tableBodyCellStyles.alignCenter,
        customStylex,
      )}
    >
      {hasEllipsis ? (
        <span
          title={typeof content === 'string' ? content : undefined}
          {...stylex.props(tableBodyCellStyles.textContent)}
        >
          {content}
        </span>
      ) : (
        content
      )}
      {isLoading && <div {...stylex.props(tableBodyCellStyles.loadingOverlay)} />}
    </td>
  );
};
