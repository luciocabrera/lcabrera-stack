import { Checkbox } from '#ui/components/Checkbox';

import type { TableCheckDisplayProps } from './TableCheckDisplay.types';

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
    <Checkbox
      aria-label={label}
      dataTestId='table-check-display-icon'
      isChecked={isChecked}
      isDisabled
      isReadOnly
      tabIndex={-1}
    />
  );
};
