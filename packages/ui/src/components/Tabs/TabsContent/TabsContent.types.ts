import type { TabItem } from '../Tabs.types';

export type TabsContentProps = {
  readonly activeTab: string;
  readonly tabs: readonly TabItem[];
};
