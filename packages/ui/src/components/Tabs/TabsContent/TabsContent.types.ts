import type { TabItem } from '../Tabs.types';

/**
 * TabsContent component props
 */
export type TabsContentProps = {
  /** Currently active tab key */
  readonly activeTab: string;
  /** Array of tab configurations */
  readonly tabs: readonly TabItem[];
};
