import type { GlobalNavigationSizePreference } from '#ui/types/globalSettings.types';

import { NAVIGATION_SIZE_VALUES } from './globalSettings.constants';

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
