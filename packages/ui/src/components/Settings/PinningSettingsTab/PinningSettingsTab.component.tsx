import * as stylex from '@stylexjs/stylex';

import {
  ORDER_CONFLICT_PREFERENCE_OPTIONS,
  PIN_CONFLICT_PREFERENCE_OPTIONS,
  PIN_SIDE_PREFERENCE_OPTIONS,
  UNPIN_CONFLICT_PREFERENCE_OPTIONS,
} from '#ui/constants/pinningPreferences.constants';

import type { SettingsDraft } from '../Settings.types';

import { styles } from '../Settings.stylex';
import { useSetSettingsDraftField } from '../SettingsDraftContext/actions';
import { useGetSettingsDraft } from '../SettingsDraftContext/selectors';
import { SettingsOptionSection } from '../SettingsOptionSection';

/**
 * Pinning preferences tab. Owns its store wiring: reads the staged settings
 * draft and stages field updates itself.
 */
export const PinningSettingsTab = () => {
  const draft = useGetSettingsDraft();
  const setSettingsDraftField = useSetSettingsDraftField();

  const handlePinSideChange = (value: SettingsDraft['pinSide']) => {
    setSettingsDraftField({ key: 'pinSide', value });
  };

  const handleOrderConflictChange = (
    value: SettingsDraft['orderConflictResolution'],
  ) => {
    setSettingsDraftField({ key: 'orderConflictResolution', value });
  };

  const handlePinConflictChange = (
    value: SettingsDraft['pinConflictResolution'],
  ) => {
    setSettingsDraftField({ key: 'pinConflictResolution', value });
  };

  const handleUnpinConflictChange = (
    value: SettingsDraft['unpinConflictResolution'],
  ) => {
    setSettingsDraftField({ key: 'unpinConflictResolution', value });
  };

  return (
    <div {...stylex.props(styles.tabSections)}>
      <SettingsOptionSection
        description='Used when pinning a column. If set to Always ask, the pin side modal will be shown every time.'
        name='settings-pin-side-preference'
        onChange={handlePinSideChange}
        options={PIN_SIDE_PREFERENCE_OPTIONS}
        title='Pin Side Preference'
        value={draft.pinSide}
      />

      <SettingsOptionSection
        description='Used when dragging a column creates an order and pinning conflict.'
        name='settings-order-conflict-preference'
        onChange={handleOrderConflictChange}
        options={ORDER_CONFLICT_PREFERENCE_OPTIONS}
        title='Order Conflict Preference'
        value={draft.orderConflictResolution}
      />

      <SettingsOptionSection
        description='Used when a pin action creates a contiguity conflict.'
        name='settings-pin-conflict-preference'
        onChange={handlePinConflictChange}
        options={PIN_CONFLICT_PREFERENCE_OPTIONS}
        title='Pin Conflict Preference'
        value={draft.pinConflictResolution}
      />

      <SettingsOptionSection
        description='Used when unpinning a column would leave a gap in a pinned block.'
        name='settings-unpin-conflict-preference'
        onChange={handleUnpinConflictChange}
        options={UNPIN_CONFLICT_PREFERENCE_OPTIONS}
        title='Unpin Conflict Preference'
        value={draft.unpinConflictResolution}
      />
    </div>
  );
};
