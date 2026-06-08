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

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { RadioOptionGroup } from '@/components/RadioOptionGroup';
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
          <Card color='default' elevation='sm' padding='lg'>
            <section {...stylex.props(styles.section)}>
              <h2 {...stylex.props(styles.sectionTitle)}>Navbar Size</h2>
              <p {...stylex.props(styles.description)}>
                Controls the global navigation width and density across the app.
              </p>
              <RadioOptionGroup
                name='settings-navigation-size-preference'
                onChange={handleNavigationSizeChange}
                options={NAVIGATION_SIZE_PREFERENCE_OPTIONS}
                value={draft.navigationSize}
              />
            </section>
          </Card>

          <Card color='default' elevation='sm' padding='lg'>
            <section {...stylex.props(styles.section)}>
              <h2 {...stylex.props(styles.sectionTitle)}>Collapsed/Expanded</h2>
              <p {...stylex.props(styles.description)}>
                Determines the initial state of the navigation bar when the page
                loads.
              </p>
              <RadioOptionGroup
                name='settings-navigation-collapsed-preference'
                onChange={handleNavigationCollapsedChange}
                options={NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS}
                value={draft.navigationCollapsed}
              />
            </section>
          </Card>

          <Card color='default' elevation='sm' padding='lg'>
            <section {...stylex.props(styles.section)}>
              <h2 {...stylex.props(styles.sectionTitle)}>Pinned/Unpinned</h2>
              <p {...stylex.props(styles.description)}>
                Determines if the navigation bar is fixed to the left or floats
                on scroll.
              </p>
              <RadioOptionGroup
                name='settings-navigation-pinned-preference'
                onChange={handleNavigationPinnedChange}
                options={NAVIGATION_PINNED_PREFERENCE_OPTIONS}
                value={draft.navigationPinned}
              />
            </section>
          </Card>
        </div>
      ),
      header: 'Navigation',
      key: 'navigation',
    },
    {
      children: (
        <div {...stylex.props(styles.tabSections)}>
          <Card color='default' elevation='sm' padding='lg'>
            <section {...stylex.props(styles.section)}>
              <h2 {...stylex.props(styles.sectionTitle)}>
                Pin Side Preference
              </h2>
              <p {...stylex.props(styles.description)}>
                Used when pinning a column. If set to Always ask, the pin side
                modal will be shown every time.
              </p>
              <RadioOptionGroup
                name='settings-pin-side-preference'
                onChange={handlePinSideChange}
                options={PIN_SIDE_PREFERENCE_OPTIONS}
                value={draft.pinSide}
              />
            </section>
          </Card>

          <Card color='default' elevation='sm' padding='lg'>
            <section {...stylex.props(styles.section)}>
              <h2 {...stylex.props(styles.sectionTitle)}>
                Order Conflict Preference
              </h2>
              <p {...stylex.props(styles.description)}>
                Used when dragging a column creates an order and pinning
                conflict.
              </p>
              <RadioOptionGroup
                name='settings-order-conflict-preference'
                onChange={handleOrderConflictChange}
                options={ORDER_CONFLICT_PREFERENCE_OPTIONS}
                value={draft.orderConflictResolution}
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
                value={draft.pinConflictResolution}
              />
            </section>
          </Card>

          <Card color='default' elevation='sm' padding='lg'>
            <section {...stylex.props(styles.section)}>
              <h2 {...stylex.props(styles.sectionTitle)}>
                Unpin Conflict Preference
              </h2>
              <p {...stylex.props(styles.description)}>
                Used when unpinning a column would leave a gap in a pinned
                block.
              </p>
              <RadioOptionGroup
                name='settings-unpin-conflict-preference'
                onChange={handleUnpinConflictChange}
                options={UNPIN_CONFLICT_PREFERENCE_OPTIONS}
                value={draft.unpinConflictResolution}
              />
            </section>
          </Card>
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
