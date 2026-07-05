import type { ToolbarItemConfig } from '@repo/ui/components/Toolbar/Toolbar.types';

export type AppShellProps = {
  /** Forwarded to `AppNavigation` — see its own prop doc for why this is app-supplied. */
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly ToolbarItemConfig[];
};
