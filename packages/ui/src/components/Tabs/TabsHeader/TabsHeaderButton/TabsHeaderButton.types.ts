import type { TabItem } from '../../Tabs.types';

export type SetTabRefArgs = {
  readonly element: HTMLButtonElement | null;
  readonly tabKey: string;
};

export type TabsHeaderButtonProps = {
  readonly activeTab: string;
  readonly isBusy: boolean;
  readonly onSelectTab: (tabKey: string) => void;
  readonly setTabRef: (args: SetTabRefArgs) => void;
  readonly tab: TabItem;
};
