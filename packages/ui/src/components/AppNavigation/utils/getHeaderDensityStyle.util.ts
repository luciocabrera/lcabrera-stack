import type { GlobalNavigationSizePreference } from '#ui/types/globalSettings.types';

import { styles } from '../AppNavigation.stylex';

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
