import type { NavbarItemConfig } from '@repo/ui/components/Navbar/Navbar.types';

import {
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
} from '@repo/ui/components/Icons';

/**
 * Returns navigation items with icons scaled to the given size.
 */
export const getNavigationItems = (
  iconSize: number,
): readonly NavbarItemConfig[] => [
  {
    end: true,
    icon: <HomeIcon size={iconSize} />,
    label: 'Home',
    to: '/',
    type: 'link',
    variant: 'primary',
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
];
