import type { SettingsDraft } from '../Settings.types';

export type NavigationSettingsTabProps = {
  readonly draft: SettingsDraft;
  readonly onNavigationCollapsedChange: (
    value: SettingsDraft['navigationCollapsed'],
  ) => void;
  readonly onNavigationPinnedChange: (
    value: SettingsDraft['navigationPinned'],
  ) => void;
  readonly onNavigationSizeChange: (
    value: SettingsDraft['navigationSize'],
  ) => void;
};
