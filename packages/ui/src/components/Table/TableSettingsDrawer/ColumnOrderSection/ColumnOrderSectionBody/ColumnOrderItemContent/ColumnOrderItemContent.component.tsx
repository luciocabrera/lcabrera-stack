import * as stylex from '@stylexjs/stylex';

import { LockIcon } from '#ui/components/Icons';
import { ToggleSwitch } from '#ui/components/ToggleSwitch';

import type { ColumnOrderItemContentProps } from './ColumnOrderItemContent.types';

import {
  useToggleColumnPin,
  useToggleColumnVisibility,
} from '../../ColumnOrderSectionContext/actions';
import { styles } from './ColumnOrderItemContent.stylex';

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
      {Boolean(isLocked) && <LockIcon size={14} />}
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
