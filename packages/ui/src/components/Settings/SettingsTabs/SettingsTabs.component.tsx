import type { TabItem } from '@lcabrera/ui/components/Tabs';

import { Tabs } from '@lcabrera/ui/components/Tabs';

import { NavigationSettingsTab } from '../NavigationSettingsTab';
import { PinningSettingsTab } from '../PinningSettingsTab';

/**
 * Tab set of the global settings page: the self-connected Navigation and
 * Pinning preference tabs. Pure composition — no store wiring.
 */
export const SettingsTabs = () => {
  const tabs: readonly TabItem[] = [
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

  return <Tabs defaultSelectedTab='pinning' tabs={tabs} />;
};
