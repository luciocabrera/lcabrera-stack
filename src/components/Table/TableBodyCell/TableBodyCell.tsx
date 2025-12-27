import * as stylex from '@stylexjs/stylex';

import type { TableBodyCellDataType, TableBodyCellProps } from './TableBodyCell.types';

import { tableBodyCellStyles } from './TableBodyCell.stylex';

type RenderCellContentParams = {
  dataType: TableBodyCellDataType;
  value: unknown;
};

function detectDataType(value: unknown): TableBodyCellDataType {
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'string') {
    // Check if it's a currency (starts with $ or other currency symbols)
    if (/^[$€£¥₹]/.test(value)) {
      return 'currency';
    }
    // Check if it's a date (ISO date format YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return 'date';
    }
  }
  return 'string';
}

function renderCellContent({ dataType, value }: RenderCellContentParams) {
  switch (dataType) {
    case 'boolean': {
      return (
        <input
          checked={Boolean(value)}
          readOnly
          tabIndex={-1}
          type="checkbox"
          {...stylex.props(tableBodyCellStyles.checkbox)}
        />
      );
    }
    case 'currency':
    case 'date':
    case 'number': {
      return String(value);
    }
    default: {
      return typeof value === 'string' ? value : '';
    }
  }
}

export const TableBodyCell = ({
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
      style={{ minWidth, width }}
      {...rest}
      {...stylex.props(
        tableBodyCellStyles.base,
        isRightAligned && tableBodyCellStyles.alignRight,
        isCentered && tableBodyCellStyles.alignCenter,
        customStylex,
      )}
    >
      {renderCellContent({ dataType, value })}
    </td>
  );
};
