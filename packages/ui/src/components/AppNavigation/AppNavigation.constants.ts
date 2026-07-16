import type { SidePanelSize } from '@repo/ui/components/SidePanel';
import type { GlobalNavigationSizePreference } from '@repo/ui/types/globalSettings.types';

import {
  ICON_SIZE_LG,
  ICON_SIZE_MD,
  ICON_SIZE_SM,
  ICON_SIZE_XS,
  ICON_SIZE_XXS,
} from '@repo/ui/design-system/constants';

/**
 * Which brand icon box size style to apply (matches button height per density).
 * - 'mini' → 1.75rem (matches mini button)
 * - 'sm'   → 2rem    (matches sm button)
 * - 'md'   → 2.5rem  (matches md button)
 */
type BrandIconBoxSize = 'md' | 'mini' | 'sm';

type NavDensityConfig = {
  readonly brandIconBoxSize: BrandIconBoxSize;
  readonly brandIconSize: number;
  readonly collapsedSize: SidePanelSize;
  readonly controlButtonSize: 'md' | 'mini' | 'sm';
  readonly controlIconSize: number;
  readonly expandedSize: SidePanelSize;
  readonly navIconSize: number;
};

/**
 * Icon sizes, button density, and panel width mapped to each navigation size
 * preference. The density affects all buttons and icons in the sidebar.
 */
export const NAV_DENSITY: Record<
  GlobalNavigationSizePreference,
  NavDensityConfig
> = {
  compact: {
    brandIconBoxSize: 'mini',
    brandIconSize: ICON_SIZE_XS,
    collapsedSize: 'xxs',
    controlButtonSize: 'mini',
    controlIconSize: ICON_SIZE_XXS,
    expandedSize: 'xs',
    navIconSize: ICON_SIZE_SM,
  },
  large: {
    brandIconBoxSize: 'md',
    brandIconSize: ICON_SIZE_LG,
    collapsedSize: 'rail',
    controlButtonSize: 'md',
    controlIconSize: ICON_SIZE_LG,
    expandedSize: 'lg',
    navIconSize: ICON_SIZE_LG,
  },
  medium: {
    brandIconBoxSize: 'sm',
    brandIconSize: ICON_SIZE_MD,
    collapsedSize: 'rail',
    controlButtonSize: 'sm',
    controlIconSize: ICON_SIZE_SM,
    expandedSize: 'md',
    navIconSize: ICON_SIZE_LG,
  },
  small: {
    brandIconBoxSize: 'mini',
    brandIconSize: ICON_SIZE_SM,
    collapsedSize: 'rail',
    controlButtonSize: 'mini',
    controlIconSize: ICON_SIZE_XS,
    expandedSize: 'sm',
    navIconSize: ICON_SIZE_MD,
  },
} as const;
