import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TabItem = {
  readonly children: ReactNode;
  /** Defaults to `true`; `false` drops the body's horizontal inset for this tab. */
  readonly hasPadding?: boolean;
  readonly header: ReactNode;
  readonly key: string;
};

export type TabsProps = ComponentPropsWithoutRef<'div'> & {
  readonly defaultSelectedTab?: string;
  readonly isBusy?: boolean;
  /** Names the tab strip; required when a page paints more than one. */
  readonly label?: string;
  readonly onSelectTab?: (tabKey: string) => void;
  readonly selectedTab?: string;
  readonly tabs: readonly TabItem[];
};
