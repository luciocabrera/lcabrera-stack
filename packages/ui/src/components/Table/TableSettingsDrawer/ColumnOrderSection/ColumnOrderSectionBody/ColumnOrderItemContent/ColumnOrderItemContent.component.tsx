import { LockIcon } from '@lcabrera/ui/components/Icons';
import { ToggleSwitch } from '@lcabrera/ui/components/ToggleSwitch';
import * as stylex from '@stylexjs/stylex';

import type { ColumnOrderItemContentProps } from './ColumnOrderItemContent.types';

import {
  useToggleColumnPin,
  useToggleColumnVisibility,
} from '../../ColumnOrderSectionContext/actions';
import { styles } from './ColumnOrderItemContent.stylex';

/**
 * Row content for one column in the column order list: lock indicator for
 * static columns, the column label, and the Pin/Show toggles. Owns its store
 * wiring: dispatches the pin and visibility toggle actions itself.
 */
export const ColumnOrderItemContent = ({
  columnKey,
  isBusy = false,
  isPinned,
  isStatic,
  isVisible,
  label,
}: ColumnOrderItemContentProps) => {
  const toggleColumnPin = useToggleColumnPin();
  const toggleColumnVisibility = useToggleColumnVisibility();

  const handlePinChange = (isChecked: boolean) => {
    toggleColumnPin({ columnKey, isPinning: isChecked });
  };

  const handleVisibilityChange = (isChecked: boolean) => {
    toggleColumnVisibility({ columnKey, isVisible: isChecked });
  };

  return (
    <div {...stylex.props(styles.columnItem)}>
      {Boolean(isStatic) && <LockIcon size={14} />}
      <span {...stylex.props(styles.columnLabel)}>{label}</span>
      <ToggleSwitch
        isBusy={isBusy}
        isChecked={isPinned}
        isDisabled={isStatic}
        label='Pin'
        onChange={handlePinChange}
      />
      <ToggleSwitch
        isBusy={isBusy}
        isChecked={isVisible}
        isDisabled={isStatic}
        label='Show'
        onChange={handleVisibilityChange}
      />
    </div>
  );
};
