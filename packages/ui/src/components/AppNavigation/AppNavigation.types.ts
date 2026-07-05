import type { ToolbarItemConfig } from '@repo/ui/components/Toolbar/Toolbar.types';

/**
 * Props for the application navigation sidebar.
 */
export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  /**
   * Returns this app's own route links, sized for the given icon size.
   * The sidebar itself has no opinion on what routes exist — each
   * consuming app supplies its own (e.g.
   * `apps/react-router/src/root/getNavigationItems.util.tsx`).
   */
  readonly getNavigationItems: (
    iconSize: number,
  ) => readonly ToolbarItemConfig[];
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
};
