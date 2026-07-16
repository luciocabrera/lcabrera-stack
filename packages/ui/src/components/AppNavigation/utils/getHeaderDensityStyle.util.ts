import type { GlobalNavigationSizePreference } from '@repo/ui/types/globalSettings.types';

import { styles } from '../AppNavigation.stylex';

/**
 * Returns the density-responsive StyleX style for the panel header padding and
 * gap, or `undefined` for the medium (default) density.
 */
export const getHeaderDensityStyle = (
  navigationSizePreference: GlobalNavigationSizePreference | undefined,
) => {
  if (navigationSizePreference === 'compact') {
    return styles.headerDensityCompact;
  }

  if (navigationSizePreference === 'small') {
    return styles.headerDensitySmall;
  }

  if (navigationSizePreference === 'large') {
    return styles.headerDensityLarge;
  }
};
