import * as stylex from '@stylexjs/stylex';

import type { TableBodyCellProps } from './TableBodyCell.types';

import { tableBodyCellStyles } from './TableBodyCell.stylex';
import { detectDataType, renderCellContent } from './utils';

export const TableBodyCell = ({
  columnLabel,
  customStylex,
  dataType: dataTypeProp,
  minWidth,
  value,
  width,
  ...rest
}: TableBodyCellProps) => {
  const dataType = dataTypeProp ?? detectDataType(value);

  const isRightAligned = dataType === 'number' || dataType === 'currency';
  const isCentered = dataType === 'boolean' || dataType === 'date';

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
      {renderCellContent({
        columnLabel,
        dataType,
        value,
      })}
    </td>
  );
};
