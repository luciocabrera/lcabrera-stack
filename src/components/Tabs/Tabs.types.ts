import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Individual tab item configuration
 */
export type TabItem = {
  /** Content to display when tab is active */
  children: ReactNode;
  /** Text or element to display in tab header */
  header: ReactNode;
  /** Unique identifier for the tab */
  key: string;
};

/**
 * Tabs component props
 */
export type TabsProps = ComponentPropsWithoutRef<'div'> & {
  /** Initially selected tab key (defaults to first tab) */
  defaultSelectedTab?: string;
  /** Array of tab configurations */
  tabs: TabItem[];
};
