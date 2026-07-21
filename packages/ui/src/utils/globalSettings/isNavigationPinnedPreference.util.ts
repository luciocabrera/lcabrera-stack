import type { GlobalNavigationPinnedPreference } from '@lcabrera/ui/types/globalSettings.types';

import { NAVIGATION_PINNED_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to a navigation pinned preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid pinned/unpinned preference.
 */
export const isNavigationPinnedPreference = (
  value: unknown,
): value is GlobalNavigationPinnedPreference => {
  return (
    typeof value === 'string' &&
    NAVIGATION_PINNED_VALUES.includes(
      value as (typeof NAVIGATION_PINNED_VALUES)[number],
    )
  );
};
