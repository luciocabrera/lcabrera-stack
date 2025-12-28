import * as stylex from '@stylexjs/stylex';

import { CheckIcon } from '@/components/Icons';

import type { TableColumnDataType } from '../../Table.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

type RenderCellContentArgs = {
  columnLabel?: string;
  dataType: TableColumnDataType;
  value: unknown;
};

export const renderCellContent = ({
  columnLabel,
  dataType,
  value,
}: RenderCellContentArgs) => {
  switch (dataType) {
    case 'boolean': {
      const isChecked = Boolean(value);
      const label = columnLabel
        ? `${columnLabel}: ${isChecked ? 'Yes' : 'No'}`
        : isChecked
          ? 'Checked'
          : 'Unchecked';
      return (
        <div
          aria-checked={isChecked}
          aria-label={label}
          role='checkbox'
          {...stylex.props(
            tableBodyCellStyles.checkbox,
            isChecked && tableBodyCellStyles.checkboxChecked,
          )}
        >
          {isChecked && <CheckIcon />}
        </div>
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
};
