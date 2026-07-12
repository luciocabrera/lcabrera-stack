import type { BuildNavigationUpdateArgs } from '../Settings.types';

import {
  DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
  DEFAULT_NAVIGATION_PINNED_PREFERENCE,
  DEFAULT_NAVIGATION_SIZE_PREFERENCE,
} from '../Settings.constants';

export const toGlobalNavigationPreferencesUpdate = ({
  draft,
  navigationPreferences,
}: BuildNavigationUpdateArgs) => {
  const isCollapsedChanged =
    draft.navigationCollapsed !==
    (navigationPreferences.collapsed ??
      DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE);
  const isPinnedChanged =
    draft.navigationPinned !==
    (navigationPreferences.pinned ?? DEFAULT_NAVIGATION_PINNED_PREFERENCE);
  const isSizeChanged =
    draft.navigationSize !==
    (navigationPreferences.size ?? DEFAULT_NAVIGATION_SIZE_PREFERENCE);

  if (!isCollapsedChanged && !isPinnedChanged && !isSizeChanged) {
    return;
  }

  return {
    ...(isCollapsedChanged && {
      collapsed:
        draft.navigationCollapsed === DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE
          ? undefined
          : draft.navigationCollapsed,
    }),
    ...(isPinnedChanged && {
      pinned:
        draft.navigationPinned === DEFAULT_NAVIGATION_PINNED_PREFERENCE
          ? undefined
          : draft.navigationPinned,
    }),
    ...(isSizeChanged && {
      size:
        draft.navigationSize === DEFAULT_NAVIGATION_SIZE_PREFERENCE
          ? undefined
          : draft.navigationSize,
    }),
  };
};
