import * as stylex from '@stylexjs/stylex';

import { CheckIcon } from '@/components/Icons';
import { ICON_SIZE_XXS } from '@/design-system/constants';

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
    <span {...stylex.props(tableCheckDisplayStyles.container)}>
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
      {isChecked && (
        <span
          aria-hidden='true'
          data-testid='table-check-display-icon'
          {...stylex.props(tableCheckDisplayStyles.checkIconContainer)}
        >
          <CheckIcon size={ICON_SIZE_XXS} />
        </span>
      )}
    </span>
  );
};
