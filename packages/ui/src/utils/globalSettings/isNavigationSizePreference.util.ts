import type { GlobalNavigationSizePreference } from '#ui/types/globalSettings.types';

import { NAVIGATION_SIZE_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to a navigation size preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid navigation size preference.
 */
export const isNavigationSizePreference = (
  value: unknown,
): value is GlobalNavigationSizePreference => {
  return (
    typeof value === 'string' &&
    NAVIGATION_SIZE_VALUES.includes(
      value as (typeof NAVIGATION_SIZE_VALUES)[number],
    )
  );
};
