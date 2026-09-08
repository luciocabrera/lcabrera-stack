import type { TabItem } from '#ui/components/Tabs';

import type { TableSettingsTabRole } from '../Table.types';

import { TABLE_SETTINGS_TAB_ROLE_BY_KEY } from '../Table.constants';

type OrderSettingsTabsArgs = {
  readonly order: readonly TableSettingsTabRole[];
  readonly tabs: readonly TabItem[];
};

export const orderSettingsTabs = ({ order, tabs }: OrderSettingsTabsArgs) => {
  const rankOf = (tab: TabItem) => {
    const role = TABLE_SETTINGS_TAB_ROLE_BY_KEY[tab.key];
    const rank = role === undefined ? -1 : order.indexOf(role);

    return rank === -1 ? order.length : rank;
  };

  return tabs.toSorted((left, right) => rankOf(left) - rankOf(right));
};
