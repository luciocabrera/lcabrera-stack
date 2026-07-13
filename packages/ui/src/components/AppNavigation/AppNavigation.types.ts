import type { ToolbarItemConfig } from '@repo/ui/components/Toolbar/Toolbar.types';

export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly ToolbarItemConfig[];
};
