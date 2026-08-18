import * as stylex from '@stylexjs/stylex';

import { LockIcon } from '#ui/components/Icons';
import { ToggleSwitch } from '#ui/components/ToggleSwitch';

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
 *
 * **A group key is listed and locked, not hidden** (ADR-080). It is one of the
 * consumer's own columns, so a drawer row for it answers something — which is
 * why it stays listed where the retired hierarchy column was filtered out — but
 * its position and visibility are the grouping's while grouping is applied.
 */
export const ColumnOrderItemContent = ({
  columnKey,
  isBusy = false,
  isGroupKey,
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

  const isLocked = isStatic || isGroupKey;

  return (
    <div {...stylex.props(styles.columnItem)}>
      {isLocked ? <LockIcon size={14} /> : null}
      <span {...stylex.props(styles.columnLabel)}>{label}</span>
      <ToggleSwitch
        isBusy={isBusy}
        isChecked={isPinned}
        isDisabled={isLocked}
        label='Pin'
        onChange={handlePinChange}
      />
      <ToggleSwitch
        isBusy={isBusy}
        isChecked={isVisible}
        isDisabled={isLocked}
        label='Show'
        onChange={handleVisibilityChange}
      />
    </div>
  );
};
