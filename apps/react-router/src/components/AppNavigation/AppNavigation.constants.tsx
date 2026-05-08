import {
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
} from '@/components/Icons';
import {
  ICON_SIZE_LG,
  ICON_SIZE_MD,
  ICON_SIZE_SM,
  ICON_SIZE_XS,
  ICON_SIZE_XXS,
} from '@/design-system/constants';

import type { ToolbarItemConfig } from '@/components/Toolbar/Toolbar.types';
import type { SidePanelSize } from '@/components/SidePanel';
import type { GlobalNavigationSizePreference } from '@/types/globalSettings.types';

/**
 * Which brand icon box size style to apply (matches button height per density).
 * - 'mini' → 1.75rem (matches mini button)
 * - 'sm'   → 2rem    (matches sm button)
 * - 'md'   → 2.5rem  (matches md button)
 */
export type BrandIconBoxSize = 'md' | 'mini' | 'sm';

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

/**
 * Returns navigation items with icons scaled to the given size.
 */
export const getNavigationItems = (
  iconSize: number,
): readonly ToolbarItemConfig[] => [
  {
    color: 'primary',
    end: true,
    icon: <HomeIcon size={iconSize} />,
    label: 'Home',
    to: '/',
    type: 'link',
  },
  {
    icon: <SettingsIcon size={iconSize} />,
    label: 'Settings',
    to: '/settings',
    type: 'link',
  },
  {
    icon: <BarChartIcon size={iconSize} />,
    label: 'Car Sales',
    to: '/car-sales',
    type: 'link',
  },
  {
    icon: <BarChartIcon size={iconSize} />,
    label: 'Car Sales Infinite',
    to: '/car-sales-infinite',
    type: 'link',
  },
  {
    icon: <FileTextIcon size={iconSize} />,
    label: 'Enterprise Orders',
    to: '/enterprise-orders',
    type: 'link',
  },
  {
    icon: <FileTextIcon size={iconSize} />,
    label: 'Wide All-Types 150',
    to: '/wide-alltypes-150',
    type: 'link',
  },
  {
    icon: <FileTextIcon size={iconSize} />,
    label: 'Wide All-Types 150 TanStack',
    to: '/wide-alltypes-150-tanstack',
    type: 'link',
  },
];
