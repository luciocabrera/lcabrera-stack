import type { TabItem } from '@repo/ui/components/Tabs';

import { Button } from '@repo/ui/components/Button';
import { Tabs } from '@repo/ui/components/Tabs';
import {
  useSetGlobalNavigationPreferences,
  useSetGlobalPinningPreferences,
} from '@repo/ui/contexts/GlobalSettingsContext/actions';
import {
  useGetGlobalNavigationPreferences,
  useGetGlobalPinningPreferences,
} from '@repo/ui/contexts/GlobalSettingsContext/selectors';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { SettingsDraft } from './Settings.types';

import { NavigationSettingsTab } from './NavigationSettingsTab';
import { PinningSettingsTab } from './PinningSettingsTab';
import { styles } from './Settings.stylex';
import {
  toDraft,
  toGlobalNavigationPreferencesUpdate,
  toGlobalPinningPreferencesUpdate,
} from './utils';

export const Settings = () => {
  const navigationPreferences = useGetGlobalNavigationPreferences();
  const pinningPreferences = useGetGlobalPinningPreferences();
  const setGlobalNavigationPreferences = useSetGlobalNavigationPreferences();
  const setGlobalPinningPreferences = useSetGlobalPinningPreferences();

  const [draft, setDraft] = useState<SettingsDraft>(() => {
    return toDraft({ navigationPreferences, pinningPreferences });
  });

  // Single source of truth for default resolution — compare against the same
  // baseline toDraft produces so preference additions stay in one place.
  const baseline = toDraft({ navigationPreferences, pinningPreferences });

  const hasNavigationChanges =
    draft.navigationCollapsed !== baseline.navigationCollapsed ||
    draft.navigationPinned !== baseline.navigationPinned ||
    draft.navigationSize !== baseline.navigationSize;

  const hasPinningChanges =
    draft.orderConflictResolution !== baseline.orderConflictResolution ||
    draft.pinSide !== baseline.pinSide ||
    draft.pinConflictResolution !== baseline.pinConflictResolution ||
    draft.unpinConflictResolution !== baseline.unpinConflictResolution;

  const hasChanges = hasNavigationChanges || hasPinningChanges;

  const handleAccept = () => {
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
      setGlobalPinningPreferences(toGlobalPinningPreferencesUpdate({ draft }));
    }
  };

  const handleCancel = () => {
    setDraft(toDraft({ navigationPreferences, pinningPreferences }));
  };

  const makeDraftSetter =
    <K extends keyof SettingsDraft>(key: K) =>
    (value: SettingsDraft[K]) => {
      setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
    };

  const handleNavigationCollapsedChange = makeDraftSetter(
    'navigationCollapsed',
  );
  const handleNavigationPinnedChange = makeDraftSetter('navigationPinned');
  const handleNavigationSizeChange = makeDraftSetter('navigationSize');
  const handleOrderConflictChange = makeDraftSetter('orderConflictResolution');
  const handlePinConflictChange = makeDraftSetter('pinConflictResolution');
  const handlePinSideChange = makeDraftSetter('pinSide');
  const handleUnpinConflictChange = makeDraftSetter('unpinConflictResolution');

  const tabs: readonly TabItem[] = [
    {
      children: (
        <NavigationSettingsTab
          draft={draft}
          onNavigationCollapsedChange={handleNavigationCollapsedChange}
          onNavigationPinnedChange={handleNavigationPinnedChange}
          onNavigationSizeChange={handleNavigationSizeChange}
        />
      ),
      header: 'Navigation',
      key: 'navigation',
    },
    {
      children: (
        <PinningSettingsTab
          draft={draft}
          onOrderConflictChange={handleOrderConflictChange}
          onPinConflictChange={handlePinConflictChange}
          onPinSideChange={handlePinSideChange}
          onUnpinConflictChange={handleUnpinConflictChange}
        />
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
        <Button
          color='primary'
          isDisabled={!hasChanges}
          onClick={handleAccept}
          size='sm'
        >
          Accept
        </Button>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
      </div>
    </div>
  );
};
