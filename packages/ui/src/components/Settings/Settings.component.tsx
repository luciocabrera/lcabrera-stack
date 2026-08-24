import * as stylex from '@stylexjs/stylex';

import { styles } from './Settings.stylex';
import { SettingsActions } from './SettingsActions/SettingsActions.component';
import { SettingsDraftProvider } from './SettingsDraftContext/SettingsDraftContext.provider';
import { SettingsTabs } from './SettingsTabs/SettingsTabs.component';

export const Settings = () => {
  return (
    <SettingsDraftProvider>
      <div {...stylex.props(styles.container)}>
        <h1 {...stylex.props(styles.title)}>Global Settings</h1>
        <p {...stylex.props(styles.description)}>
          Preferences in this page are global and apply to all tables.
        </p>

        <SettingsTabs />

        <SettingsActions />
      </div>
    </SettingsDraftProvider>
  );
};
