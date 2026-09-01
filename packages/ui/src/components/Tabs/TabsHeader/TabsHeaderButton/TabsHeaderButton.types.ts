import type { KeyboardEventHandler } from 'react';

import type { TabItem } from '../../Tabs.types';

export type SetTabRefArgs = {
  readonly element: HTMLButtonElement | null;
  readonly tabKey: string;
};

export type TabsHeaderButtonProps = {
  readonly activeTab: string;
  readonly isBusy: boolean;
  readonly onKeyDown: KeyboardEventHandler<HTMLButtonElement>;
  readonly onSelectTab: (tabKey: string) => void;
  /** Stores each tab button for parent-managed roving focus. */
  readonly setTabRef: (args: SetTabRefArgs) => void;
  readonly tab: TabItem;
};
