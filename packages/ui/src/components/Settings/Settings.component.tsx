import * as stylex from '@stylexjs/stylex';

import { styles } from './Settings.stylex';
import { SettingsActions } from './SettingsActions/SettingsActions.component';
import { SettingsDraftProvider } from './SettingsDraftContext/SettingsDraftContext.provider';
import { SettingsTabs } from './SettingsTabs/SettingsTabs.component';

/**
 * Global settings page; a thin shell composing self-connected delegates
 * inside the settings draft store provider: SettingsTabs (Navigation +
 * Pinning preference tabs) and SettingsActions (Accept/Cancel). The staged
 * draft lives in SettingsDraftContext — no state or handlers are drilled.
 */
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
