import * as stylex from '@stylexjs/stylex';

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
    <input
      aria-label={label}
      checked={isChecked}
      disabled
      readOnly
      tabIndex={-1}
      type='checkbox'
      {...stylex.props(
        tableCheckDisplayStyles.checkbox,
        isChecked && tableCheckDisplayStyles.checkboxChecked,
      )}
    />
  );
};
