import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import {
  NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS,
  NAVIGATION_PINNED_PREFERENCE_OPTIONS,
  NAVIGATION_SIZE_PREFERENCE_OPTIONS,
} from '@/constants/globalSettings.constants';
import {
  ORDER_CONFLICT_PREFERENCE_OPTIONS,
  PIN_CONFLICT_PREFERENCE_OPTIONS,
  PIN_SIDE_PREFERENCE_OPTIONS,
  UNPIN_CONFLICT_PREFERENCE_OPTIONS,
} from '@/constants/pinningPreferences.constants';
import {
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
} from '@/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '@/contexts/GlobalSettingsContext/selectors';

import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';

import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationPinnedPreference,
  GlobalNavigationSizePreference,
} from '@/types/globalSettings.types';
import type {
  OrderConflictResolutionPreferenceOption,
  PinConflictResolutionPreferenceOption,
  PinSidePreferenceOption,
  UnpinConflictResolutionPreferenceOption,
} from '@/types/pinningPreferences.types';
import type { TabItem } from '@/components/Tabs';

import { styles } from './Settings.stylex';
import {
  DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
  DEFAULT_NAVIGATION_PINNED_PREFERENCE,
  DEFAULT_NAVIGATION_SIZE_PREFERENCE,
  DEFAULT_PINNING_PREFERENCE,
} from './Settings.constants';
import { SettingsOptionSection } from './SettingsOptionSection.component';
import type { SettingsDraft } from './Settings.types';
import { toDraft, toGlobalNavigationPreferencesUpdate } from './utils';

export const Settings = () => {
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  const [draft, setDraft] = useState<SettingsDraft>(() => {
    return toDraft(navigationPreferences, pinningPreferences);
  });

  const hasNavigationChanges =
    draft.navigationCollapsed !==
      (navigationPreferences.collapsed ??
        DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE) ||
    draft.navigationPinned !==
      (navigationPreferences.pinned ?? DEFAULT_NAVIGATION_PINNED_PREFERENCE) ||
    draft.navigationSize !==
      (navigationPreferences.size ?? DEFAULT_NAVIGATION_SIZE_PREFERENCE);

  const hasPinningChanges =
    draft.orderConflictResolution !==
      (pinningPreferences.orderConflictResolution ??
        DEFAULT_PINNING_PREFERENCE) ||
    draft.pinSide !==
      (pinningPreferences.pinSide ?? DEFAULT_PINNING_PREFERENCE) ||
    draft.pinConflictResolution !==
      (pinningPreferences.pinConflictResolution ??
        DEFAULT_PINNING_PREFERENCE) ||
    draft.unpinConflictResolution !==
      (pinningPreferences.unpinConflictResolution ??
        DEFAULT_PINNING_PREFERENCE);

  const hasChanges = hasNavigationChanges || hasPinningChanges;

  const handleAccept = (): void => {
    if (!hasChanges) {
      return;
    }

    if (hasNavigationChanges) {
      const navigationUpdate = toGlobalNavigationPreferencesUpdate({
        draft,
        navigationPreferences,
      });

      if (navigationUpdate) {
        setGlobalNavigationPreferences(navigationUpdate);
      }
    }

    if (hasPinningChanges) {
      setGlobalPinningPreferences({
        orderConflictResolution:
          draft.orderConflictResolution === DEFAULT_PINNING_PREFERENCE
            ? undefined
            : draft.orderConflictResolution,
        pinConflictResolution:
          draft.pinConflictResolution === DEFAULT_PINNING_PREFERENCE
            ? undefined
            : draft.pinConflictResolution,
        pinSide:
          draft.pinSide === DEFAULT_PINNING_PREFERENCE
            ? undefined
            : draft.pinSide,
        unpinConflictResolution:
          draft.unpinConflictResolution === DEFAULT_PINNING_PREFERENCE
            ? undefined
            : draft.unpinConflictResolution,
      });
    }
  };

  const handleCancel = (): void => {
    setDraft(toDraft(navigationPreferences, pinningPreferences));
  };

  const handleNavigationCollapsedChange = (
    value: GlobalNavigationCollapsedPreference,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        navigationCollapsed: value,
      };
    });
  };

  const handleNavigationPinnedChange = (
    value: GlobalNavigationPinnedPreference,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        navigationPinned: value,
      };
    });
  };

  const handleNavigationSizeChange = (
    value: GlobalNavigationSizePreference,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        navigationSize: value,
      };
    });
  };

  const handleOrderConflictChange = (
    value: OrderConflictResolutionPreferenceOption,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        orderConflictResolution: value,
      };
    });
  };

  const handlePinSideChange = (value: PinSidePreferenceOption): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        pinSide: value,
      };
    });
  };

  const handlePinConflictChange = (
    value: PinConflictResolutionPreferenceOption,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        pinConflictResolution: value,
      };
    });
  };

  const handleUnpinConflictChange = (
    value: UnpinConflictResolutionPreferenceOption,
  ): void => {
    setDraft((currentDraft) => {
      return {
        ...currentDraft,
        unpinConflictResolution: value,
      };
    });
  };

  const tabs: readonly TabItem[] = [
    {
      children: (
        <div {...stylex.props(styles.tabSections)}>
          <SettingsOptionSection
            description='Controls the global navigation width and density across the app.'
            name='settings-navigation-size-preference'
            onChange={handleNavigationSizeChange}
            options={NAVIGATION_SIZE_PREFERENCE_OPTIONS}
            title='Navbar Size'
            value={draft.navigationSize}
          />

          <SettingsOptionSection
            description='Determines the initial state of the navigation bar when the page loads.'
            name='settings-navigation-collapsed-preference'
            onChange={handleNavigationCollapsedChange}
            options={NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS}
            title='Collapsed/Expanded'
            value={draft.navigationCollapsed}
          />

          <SettingsOptionSection
            description='Determines if the navigation bar is fixed to the left or floats on scroll.'
            name='settings-navigation-pinned-preference'
            onChange={handleNavigationPinnedChange}
            options={NAVIGATION_PINNED_PREFERENCE_OPTIONS}
            title='Pinned/Unpinned'
            value={draft.navigationPinned}
          />
        </div>
      ),
      header: 'Navigation',
      key: 'navigation',
    },
    {
      children: (
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
      ),
      header: 'Pinning',
      key: 'pinning',
    },
  ];

  return (
    <div {...stylex.props(styles.container)}>
      <h1 {...stylex.props(styles.title)}>Global Settings</h1>
      <p {...stylex.props(styles.description)}>
        Preferences in this page are global and apply to all tables.
      </p>

      <Tabs defaultSelectedTab='pinning' tabs={tabs} />

      <div {...stylex.props(styles.actions)}>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
        <Button
          color='primary'
          isDisabled={!hasChanges}
          onClick={handleAccept}
          size='sm'
        >
          Accept
        </Button>
      </div>
    </div>
  );
};
