import type { TabItem } from '../Tabs.types';

/**
 * TabsHeader component props
 */
export type TabsHeaderProps = {
  /** Currently active tab key */
  readonly activeTab: string;
  /** Whether tab controls should render in a loading/busy state */
  readonly isBusy: boolean;
  /** Called when a tab is selected via click or keyboard navigation */
  readonly onSelectTab: (tabKey: string) => void;
  /** Array of tab configurations */
  readonly tabs: readonly TabItem[];
};
