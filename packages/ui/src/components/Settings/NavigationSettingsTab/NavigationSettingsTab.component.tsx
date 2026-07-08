import {
  NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS,
  NAVIGATION_PINNED_PREFERENCE_OPTIONS,
  NAVIGATION_SIZE_PREFERENCE_OPTIONS,
} from '@repo/ui/constants/globalSettings.constants';
import * as stylex from '@stylexjs/stylex';

import type { NavigationSettingsTabProps } from './NavigationSettingsTab.types';

import { styles } from '../Settings.stylex';
import { SettingsOptionSection } from '../SettingsOptionSection';

export const NavigationSettingsTab = ({
  draft,
  onNavigationCollapsedChange,
  onNavigationPinnedChange,
  onNavigationSizeChange,
}: NavigationSettingsTabProps) => {
  return (
    <div {...stylex.props(styles.tabSections)}>
      <SettingsOptionSection
        description='Controls the global navigation width and density across the app.'
        name='settings-navigation-size-preference'
        onChange={onNavigationSizeChange}
        options={NAVIGATION_SIZE_PREFERENCE_OPTIONS}
        title='Navbar Size'
        value={draft.navigationSize}
      />

      <SettingsOptionSection
        description='Determines the initial state of the navigation bar when the page loads.'
        name='settings-navigation-collapsed-preference'
        onChange={onNavigationCollapsedChange}
        options={NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS}
        title='Collapsed/Expanded'
        value={draft.navigationCollapsed}
      />

      <SettingsOptionSection
        description='Determines if the navigation bar is fixed to the left or floats on scroll.'
        name='settings-navigation-pinned-preference'
        onChange={onNavigationPinnedChange}
        options={NAVIGATION_PINNED_PREFERENCE_OPTIONS}
        title='Pinned/Unpinned'
        value={draft.navigationPinned}
      />
    </div>
  );
};
