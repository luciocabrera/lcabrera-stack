import * as stylex from '@stylexjs/stylex';

import { CheckIcon } from '@/components/Icons';

import type { TableCheckDisplayProps } from './TableCheckDisplay.types';

import { tableCheckDisplayStyles } from './TableCheckDisplay.stylex';

export const TableCheckDisplay = ({
  label: columnLabel,
  value,
}: TableCheckDisplayProps) => {
  const isChecked = Boolean(value);
  let label = isChecked ? 'Checked' : 'Unchecked';
  if (columnLabel) {
    label = `${columnLabel}: ${isChecked ? 'Yes' : 'No'}`;
  }
  return (
    <div
      aria-checked={isChecked}
      aria-label={label}
      role='checkbox'
      {...stylex.props(
        tableCheckDisplayStyles.checkbox,
        isChecked && tableCheckDisplayStyles.checkboxChecked,
      )}
    >
      {isChecked && <CheckIcon />}
    </div>
  );
};
