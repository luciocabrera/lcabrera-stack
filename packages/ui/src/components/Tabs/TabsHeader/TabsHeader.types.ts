import type { TabItem } from '../Tabs.types';

export type TabsHeaderProps = {
  readonly activeTab: string;
  readonly isBusy: boolean;
  readonly onSelectTab: (tabKey: string) => void;
  readonly tabs: readonly TabItem[];
};
