import type { GlobalNavigationSizePreference } from '#ui/types/globalSettings.types';

import { styles } from '../AppNavigation.stylex';

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
