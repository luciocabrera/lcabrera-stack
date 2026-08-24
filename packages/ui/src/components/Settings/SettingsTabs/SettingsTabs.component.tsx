import type { TabItem } from '#ui/components/Tabs';

import { Tabs } from '#ui/components/Tabs';

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
];

export const SettingsTabs = () => (
  <Tabs defaultSelectedTab='pinning' tabs={TABS} />
);
