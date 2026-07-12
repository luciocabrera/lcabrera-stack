import type { GlobalNavigationPinnedPreference } from '@repo/ui/types/globalSettings.types';

export type ResolvePinnedStateArgs = {
  readonly defaultIsPinned: boolean;
  readonly navigationPinnedPreference:
    | GlobalNavigationPinnedPreference
    | undefined;
};

/**
 * Derives whether the navigation is pinned from the user preference and the
 * caller-supplied default. Falls back to `defaultIsPinned` when no preference
 * has been saved yet.
 */
export const isNavigationPinned = ({
  defaultIsPinned,
  navigationPinnedPreference,
}: ResolvePinnedStateArgs) => {
  if (navigationPinnedPreference === 'pinned') {
    return true;
  }

  if (navigationPinnedPreference === 'unpinned') {
    return false;
  }

  return defaultIsPinned;
};
