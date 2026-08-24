import type { TabItem } from '../../Tabs.types';

export type SetTabRefArgs = {
  readonly element: HTMLButtonElement | null;
  readonly tabKey: string;
};

export type TabsHeaderButtonProps = {
  readonly activeTab: string;
  readonly isBusy: boolean;
  readonly onSelectTab: (tabKey: string) => void;
  /** Stores each tab button element for parent-managed roving keyboard focus */
  readonly setTabRef: (args: SetTabRefArgs) => void;
  readonly tab: TabItem;
};
