import type { TabItem } from '#ui/components/Tabs';

import { Tabs } from '#ui/components/Tabs';

import { GroupingSettingsTab } from '../GroupingSettingsTab';
import { NavigationSettingsTab } from '../NavigationSettingsTab';
import { PinningSettingsTab } from '../PinningSettingsTab';

const TABS: readonly TabItem[] = [
  {
    children: <NavigationSettingsTab />,
    header: 'Navigation',
    key: 'navigation',
  },
  {
    children: <PinningSettingsTab />,
    header: 'Pinning',
    key: 'pinning',
  },
  {
    children: <GroupingSettingsTab />,
    header: 'Grouping',
    key: 'grouping',
  },
];

export const SettingsTabs = () => (
  <Tabs defaultSelectedTab='pinning' tabs={TABS} />
);
