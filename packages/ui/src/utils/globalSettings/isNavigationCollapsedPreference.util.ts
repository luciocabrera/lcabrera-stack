import type { GlobalNavigationCollapsedPreference } from '#ui/types/globalSettings.types';

import { NAVIGATION_COLLAPSED_VALUES } from './globalSettings.constants';

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
