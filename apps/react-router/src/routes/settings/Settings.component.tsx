import * as stylex from '@stylexjs/stylex';

import {
  PIN_CONFLICT_PREFERENCE_OPTIONS,
  PIN_SIDE_PREFERENCE_OPTIONS,
  UNPIN_CONFLICT_PREFERENCE_OPTIONS,
} from '@/constants/pinningPreferences.constants';
import {
  useSetGlobalPinConflictResolutionPreference,
  useSetGlobalPinSidePreference,
  useSetGlobalUnpinConflictResolutionPreference,
} from '@/contexts/GlobalSettingsContext/actions';
import { useGetGlobalPinningPreferences } from '@/contexts/GlobalSettingsContext/selectors';

import { Card } from '@/components/Card';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';

import type {
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';

import { styles } from './Settings.stylex';

export const Settings = () => {
  const pinningPreferences = useGetGlobalPinningPreferences();
  const setGlobalPinConflictResolutionPreference =
    useSetGlobalPinConflictResolutionPreference();
  const setGlobalPinSidePreference = useSetGlobalPinSidePreference();
  const setGlobalUnpinConflictResolutionPreference =
    useSetGlobalUnpinConflictResolutionPreference();

  const handlePinSideChange = (value: PinSidePreferenceOption): void => {
    setGlobalPinSidePreference(value === 'always-ask' ? undefined : value);
  };

  const handlePinConflictChange = (
    value: PinConflictResolutionPreferenceOption,
  ): void => {
    setGlobalPinConflictResolutionPreference(
      value === 'always-ask' ? undefined : value,
    );
  };

  const handleUnpinConflictChange = (
    value: UnpinConflictResolutionPreferenceOption,
  ): void => {
    setGlobalUnpinConflictResolutionPreference(
      value === 'always-ask' ? undefined : value,
    );
  };

  return (
    <div {...stylex.props(styles.container)}>
      <h1 {...stylex.props(styles.title)}>Global Settings</h1>
      <p {...stylex.props(styles.description)}>
        Preferences in this page are global and apply to all tables.
      </p>

      <Card color='default' elevation='sm' padding='lg'>
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Pin Side Preference</h2>
          <p {...stylex.props(styles.description)}>
            Used when pinning a column. If set to Always ask, the pin side modal
            will be shown every time.
          </p>
          <RadioOptionGroup
            name='settings-pin-side-preference'
            onChange={handlePinSideChange}
            options={PIN_SIDE_PREFERENCE_OPTIONS}
            value={pinningPreferences.pinSide ?? 'always-ask'}
          />
        </section>
      </Card>

      <Card color='default' elevation='sm' padding='lg'>
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>
            Pin Conflict Preference
          </h2>
          <p {...stylex.props(styles.description)}>
            Used when a pin action creates a contiguity conflict.
          </p>
          <RadioOptionGroup
            name='settings-pin-conflict-preference'
            onChange={handlePinConflictChange}
            options={PIN_CONFLICT_PREFERENCE_OPTIONS}
            value={pinningPreferences.pinConflictResolution ?? 'always-ask'}
          />
        </section>
      </Card>

      <Card color='default' elevation='sm' padding='lg'>
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>
            Unpin Conflict Preference
          </h2>
          <p {...stylex.props(styles.description)}>
            Used when unpinning a column would leave a gap in a pinned block.
          </p>
          <RadioOptionGroup
            name='settings-unpin-conflict-preference'
            onChange={handleUnpinConflictChange}
            options={UNPIN_CONFLICT_PREFERENCE_OPTIONS}
            value={pinningPreferences.unpinConflictResolution ?? 'always-ask'}
          />
        </section>
      </Card>
    </div>
  );
};
