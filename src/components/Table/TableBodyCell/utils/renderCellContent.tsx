import * as stylex from '@stylexjs/stylex';

import { CheckIcon } from '@/components/Icons/CheckIcon';

import type { TableBodyCellDataType } from '../TableBodyCell.types';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

type RenderCellContentArgs = {
  dataType: TableBodyCellDataType;
  value: unknown;
};

export const renderCellContent = ({ dataType, value }: RenderCellContentArgs) => {
  switch (dataType) {
    case 'boolean': {
      const isChecked = Boolean(value);
      return (
        <div
          aria-checked={isChecked}
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
