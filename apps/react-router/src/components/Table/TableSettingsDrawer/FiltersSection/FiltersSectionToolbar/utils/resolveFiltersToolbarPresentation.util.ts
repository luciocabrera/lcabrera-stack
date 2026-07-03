import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { FiltersSectionToolbarProps } from '../FiltersSectionToolbar.types';

/**
 * Resolve the variant-dependent presentation values for the filters toolbar.
 * @param variant - The toolbar display variant.
 * @returns Button color/size/width, icon size, and the `isToolbar` flag.
 */
export const resolveFiltersToolbarPresentation = (
  variant: FiltersSectionToolbarProps['variant'],
) => {
  const isToolbar = variant === 'toolbar';

  return {
    buttonColor: isToolbar ? 'ghost' : 'outline',
    buttonSize: isToolbar ? 'mini' : 'sm',
    buttonWidth: isToolbar ? 'auto' : 'full',
    iconSize: isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD,
    isToolbar,
  } as const;
};
