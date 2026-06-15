import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Individual tab item configuration
 */
export type TabItem = {
  /** Content to display when tab is active */
  readonly children: ReactNode;
  /** Text or element to display in tab header */
  readonly header: ReactNode;
  /** Unique identifier for the tab */
  readonly key: string;
};

/**
 * Tabs component props
 */
export type TabsProps = ComponentPropsWithoutRef<'div'> & {
  /** Initially selected tab key (defaults to first tab) */
  readonly defaultSelectedTab?: string;
  /** Whether tab controls should render in a loading/busy state */
  readonly isBusy?: boolean;
  /** Backward-compatible alias for isBusy */
  readonly isBussy?: boolean;
  /** Called when a tab is selected */
  readonly onSelectTab?: (tabKey: string) => void;
  /** Controlled selected tab key */
  readonly selectedTab?: string;
  /** Array of tab configurations */
  readonly tabs: readonly TabItem[];
};
