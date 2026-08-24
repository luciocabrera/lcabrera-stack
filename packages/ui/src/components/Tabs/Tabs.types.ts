import type { ComponentPropsWithoutRef, ReactNode } from 'react';

export type TabItem = {
  readonly children: ReactNode;
  readonly header: ReactNode;
  readonly key: string;
};

export type TabsProps = ComponentPropsWithoutRef<'div'> & {
  readonly defaultSelectedTab?: string;
  readonly isBusy?: boolean;
  readonly onSelectTab?: (tabKey: string) => void;
  readonly selectedTab?: string;
  readonly tabs: readonly TabItem[];
};
