import {
  ORDER_CONFLICT_PREFERENCE_OPTIONS,
  PIN_CONFLICT_PREFERENCE_OPTIONS,
  PIN_SIDE_PREFERENCE_OPTIONS,
  UNPIN_CONFLICT_PREFERENCE_OPTIONS,
} from '@repo/ui/constants/pinningPreferences.constants';
import * as stylex from '@stylexjs/stylex';

import type { PinningSettingsTabProps } from './PinningSettingsTab.types';

import { styles } from '../Settings.stylex';
import { SettingsOptionSection } from '../SettingsOptionSection';

export const PinningSettingsTab = ({
  draft,
  onOrderConflictChange,
  onPinConflictChange,
  onPinSideChange,
  onUnpinConflictChange,
}: PinningSettingsTabProps) => {
  return (
    <div {...stylex.props(styles.tabSections)}>
      <SettingsOptionSection
        description='Used when pinning a column. If set to Always ask, the pin side modal will be shown every time.'
        name='settings-pin-side-preference'
        onChange={onPinSideChange}
        options={PIN_SIDE_PREFERENCE_OPTIONS}
        title='Pin Side Preference'
        value={draft.pinSide}
      />

      <SettingsOptionSection
        description='Used when dragging a column creates an order and pinning conflict.'
        name='settings-order-conflict-preference'
        onChange={onOrderConflictChange}
        options={ORDER_CONFLICT_PREFERENCE_OPTIONS}
        title='Order Conflict Preference'
        value={draft.orderConflictResolution}
      />

      <SettingsOptionSection
        description='Used when a pin action creates a contiguity conflict.'
        name='settings-pin-conflict-preference'
        onChange={onPinConflictChange}
        options={PIN_CONFLICT_PREFERENCE_OPTIONS}
        title='Pin Conflict Preference'
        value={draft.pinConflictResolution}
      />

      <SettingsOptionSection
        description='Used when unpinning a column would leave a gap in a pinned block.'
        name='settings-unpin-conflict-preference'
        onChange={onUnpinConflictChange}
        options={UNPIN_CONFLICT_PREFERENCE_OPTIONS}
        title='Unpin Conflict Preference'
        value={draft.unpinConflictResolution}
      />
    </div>
  );
};
