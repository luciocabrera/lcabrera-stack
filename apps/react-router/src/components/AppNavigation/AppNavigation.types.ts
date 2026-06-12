import type { GlobalNavigationPinnedPreference } from '@/types/globalSettings.types';

/**
 * Props for the application navigation sidebar.
 */
export type AppNavigationProps = {
  readonly defaultIsPinned?: boolean;
  readonly isDarkMode: boolean;
  readonly onToggleTheme: () => void;
};

export type ResolvePinnedStateArgs = {
  readonly defaultIsPinned: boolean;
  readonly navigationPinnedPreference:
    | GlobalNavigationPinnedPreference
    | undefined;
};
