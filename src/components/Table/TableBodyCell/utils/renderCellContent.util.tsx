import * as stylex from '@stylexjs/stylex';

import type {
  TableColumnDataType,
  TableColumnFormat,
} from '@/components/Table/Table.types';

import { CheckIcon } from '@/components/Icons';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

import { tableBodyCellStyles } from '../TableBodyCell.stylex';

type RenderCellContentArgs = {
  dataType: TableColumnDataType;
  /** Column format options */
  format?: TableColumnFormat;
  label?: string;
  /** Table-level locale override */
  locale?: string;
  value: unknown;
};

export const renderCellContent = ({
  dataType,
  format,
  label: columnLabel,
  locale,
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
    case 'currency': {
      // Handle both number and numeric string values
      const numValue =
        typeof value === 'number' ? value : Number.parseFloat(String(value));
      if (!Number.isNaN(numValue)) {
        return formatCurrency({
          currency: format?.currency?.currency,
          locale: format?.currency?.locale ?? locale,
          value: numValue,
        });
      }
      // If it's already a string with currency symbol or non-numeric, return as-is
      return String(value);
    }
    case 'date': {
      return formatDate({
        locale: format?.date?.locale ?? locale,
        preset: format?.date?.preset,
        value,
      });
    }
    case 'number': {
      // Handle both number and numeric string values
      const numValue =
        typeof value === 'number' ? value : Number.parseFloat(String(value));
      if (!Number.isNaN(numValue)) {
        return formatNumber({
          locale: format?.number?.locale ?? locale,
          maximumFractionDigits: format?.number?.maximumFractionDigits,
          minimumFractionDigits: format?.number?.minimumFractionDigits,
          value: numValue,
        });
      }
      return String(value);
    }
    default: {
      return typeof value === 'string' ? value : '';
    }
  }
};
