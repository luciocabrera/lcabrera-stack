import * as stylex from '@stylexjs/stylex';

import {
  NAVIGATION_COLLAPSED_PREFERENCE_OPTIONS,
  NAVIGATION_SIZE_PREFERENCE_OPTIONS,
} from '#ui/constants/globalSettings.constants';

import type { SettingsDraft } from '../Settings.types';

import { styles } from '../Settings.stylex';
import { useSetSettingsDraftField } from '../SettingsDraftContext/actions';
import { useGetSettingsDraft } from '../SettingsDraftContext/selectors';
import { SettingsOptionSection } from '../SettingsOptionSection';

export const NavigationSettingsTab = () => {
  const draft = useGetSettingsDraft();
  const setSettingsDraftField = useSetSettingsDraftField();

  const handleNavigationSizeChange = (
    value: SettingsDraft['navigationSize'],
  ) => {
    setSettingsDraftField({ key: 'navigationSize', value });
  };

  const handleNavigationCollapsedChange = (
    value: SettingsDraft['navigationCollapsed'],
  ) => {
    setSettingsDraftField({ key: 'navigationCollapsed', value });
  };

  return (
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
    </div>
  );
};
