import type { GlobalNavigationSizePreference } from '#ui/types/globalSettings.types';

import { styles } from '../AppNavigation.stylex';

/**
 * Returns the density-responsive StyleX style for the panel body padding, or
 * `undefined` for the medium (default) density.
 */
export const getBodyDensityStyle = (
  navigationSizePreference: GlobalNavigationSizePreference | undefined,
) => {
  if (navigationSizePreference === 'compact') {
    return styles.bodyDensityCompact;
  }

  if (navigationSizePreference === 'large') {
    return styles.bodyDensityLarge;
  }
};
