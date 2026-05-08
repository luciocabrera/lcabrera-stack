import {
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
} from '@/components/Icons';
import { ICON_SIZE_LG } from '@/design-system/constants';

import type { ToolbarItemConfig } from '@/components/Toolbar/Toolbar.types';

/**
 * Main application route links shown in the sidebar.
 */
export const NAVIGATION_ITEMS: readonly ToolbarItemConfig[] = [
  {
    color: 'primary',
    end: true,
    icon: <HomeIcon size={ICON_SIZE_LG} />,
    label: 'Home',
    to: '/',
    type: 'link',
  },
  {
    icon: <SettingsIcon size={ICON_SIZE_LG} />,
    label: 'Settings',
    to: '/settings',
    type: 'link',
  },
  {
    icon: <BarChartIcon size={ICON_SIZE_LG} />,
    label: 'Car Sales',
    to: '/car-sales',
    type: 'link',
  },
  {
    icon: <BarChartIcon size={ICON_SIZE_LG} />,
    label: 'Car Sales Infinite',
    to: '/car-sales-infinite',
    type: 'link',
  },
  {
    icon: <FileTextIcon size={ICON_SIZE_LG} />,
    label: 'Enterprise Orders',
    to: '/enterprise-orders',
    type: 'link',
  },
  {
    icon: <FileTextIcon size={ICON_SIZE_LG} />,
    label: 'Wide All-Types 150',
    to: '/wide-alltypes-150',
    type: 'link',
  },
  {
    icon: <FileTextIcon size={ICON_SIZE_LG} />,
    label: 'Wide All-Types 150 TanStack',
    to: '/wide-alltypes-150-tanstack',
    type: 'link',
  },
];
