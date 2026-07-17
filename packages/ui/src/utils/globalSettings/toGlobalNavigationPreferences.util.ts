import { isObject } from '@repo/ui/utils/typeGuards';

import { isNavigationCollapsedPreference } from './isNavigationCollapsedPreference.util';
import { isNavigationPinnedPreference } from './isNavigationPinnedPreference.util';
import { isNavigationSizePreference } from './isNavigationSizePreference.util';

/**
 * Parse the navigation slice of the settings cookie payload.
 *
 * Invalid or missing fields resolve to undefined so callers can fall back to
 * defaults per preference.
 * @param value - Raw `navigation` slice from the cookie payload.
 * @returns Validated navigation preferences, or undefined when the slice is not an object.
 */
export const toGlobalNavigationPreferences = (value: unknown) => {
  if (!isObject(value)) {
    return;
  }

  const collapsed = isNavigationCollapsedPreference(value.collapsed)
    ? value.collapsed
    : undefined;
  const pinned = isNavigationPinnedPreference(value.pinned)
    ? value.pinned
    : undefined;
  const size = isNavigationSizePreference(value.size) ? value.size : undefined;

  return { collapsed, pinned, size };
};
