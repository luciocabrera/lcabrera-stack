import type { TabItem } from '../../Tabs.types';

export type SetTabRefArgs = {
  readonly element: HTMLButtonElement | null;
  readonly tabKey: string;
};

/**
 * TabsHeaderButton component props
 */
export type TabsHeaderButtonProps = {
  /** Currently active tab key */
  readonly activeTab: string;
  /** Whether tab controls should render in a loading/busy state */
  readonly isBusy: boolean;
  /** Called when a tab is selected via click */
  readonly onSelectTab: (tabKey: string) => void;
  /** Stores each tab button element for parent-managed roving keyboard focus */
  readonly setTabRef: (args: SetTabRefArgs) => void;
  /** Tab configuration rendered by this button */
  readonly tab: TabItem;
};
