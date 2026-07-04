import type { GlobalNavigationCollapsedPreference } from '@/types/globalSettings.types';

import { NAVIGATION_COLLAPSED_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to a navigation collapsed preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid collapsed/expanded preference.
 */
export const isNavigationCollapsedPreference = (
  value: unknown,
): value is GlobalNavigationCollapsedPreference => {
  return (
    typeof value === 'string' &&
    NAVIGATION_COLLAPSED_VALUES.includes(
      value as (typeof NAVIGATION_COLLAPSED_VALUES)[number],
    )
  );
};
