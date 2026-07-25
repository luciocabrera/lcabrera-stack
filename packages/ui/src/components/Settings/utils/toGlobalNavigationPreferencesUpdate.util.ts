import type { BuildNavigationUpdateArgs } from '../Settings.types';

import {
  DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE,
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
  const isSizeChanged =
    draft.navigationSize !==
    (navigationPreferences.size ?? DEFAULT_NAVIGATION_SIZE_PREFERENCE);

  if (!isCollapsedChanged && !isSizeChanged) {
    return;
  }

  return {
    ...(isCollapsedChanged && {
      collapsed:
        draft.navigationCollapsed === DEFAULT_NAVIGATION_COLLAPSED_PREFERENCE
          ? undefined
          : draft.navigationCollapsed,
    }),
    ...(isSizeChanged && {
      size:
        draft.navigationSize === DEFAULT_NAVIGATION_SIZE_PREFERENCE
          ? undefined
          : draft.navigationSize,
    }),
  };
};
