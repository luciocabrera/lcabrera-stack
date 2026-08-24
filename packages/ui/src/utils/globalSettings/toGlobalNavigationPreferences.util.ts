import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { isNavigationCollapsedPreference } from './isNavigationCollapsedPreference.util';
import { isNavigationSizePreference } from './isNavigationSizePreference.util';

export const toGlobalNavigationPreferences = (value: unknown) => {
  if (!isObject(value)) {
    return;
  }

  const collapsed = isNavigationCollapsedPreference(value.collapsed)
    ? value.collapsed
    : undefined;
  const size = isNavigationSizePreference(value.size) ? value.size : undefined;

  return { collapsed, size };
};
