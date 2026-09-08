import { TABLE_SETTINGS_TAB_ROLES } from '#ui/components/Table/Table.constants';

import type { SettingsDraft } from '../Settings.types';

type ToGlobalTablePanelPreferencesUpdateArgs = {
  readonly draft: SettingsDraft;
};

export const toGlobalTablePanelPreferencesUpdate = ({
  draft,
}: ToGlobalTablePanelPreferencesUpdateArgs) => {
  const isDeclaredOrder =
    draft.settingsTabOrder.length === TABLE_SETTINGS_TAB_ROLES.length &&
    draft.settingsTabOrder.every(
      (role, index) => role === TABLE_SETTINGS_TAB_ROLES[index],
    );

  return {
    settingsTabOrder: isDeclaredOrder ? undefined : draft.settingsTabOrder,
  };
};
