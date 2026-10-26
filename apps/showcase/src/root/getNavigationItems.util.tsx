import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';

import {
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
} from '@lcabrera/ui/components/Icons';

type GetNavigationItemsArgs = {
  readonly iconSize: number;
  readonly isEvalsDashboardEnabled: boolean;
};

export const getNavigationItems = ({
  iconSize,
  isEvalsDashboardEnabled,
}: GetNavigationItemsArgs): readonly NavbarItemConfig[] => [
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
    icon: <BarChartIcon size={iconSize} />,
    label: 'Skill Scores',
    to: '/skill-scores',
    type: 'link',
  },
  ...(isEvalsDashboardEnabled
    ? [
        {
          icon: <BarChartIcon size={iconSize} />,
          label: 'Evals',
          to: '/evals',
          type: 'link',
        } satisfies NavbarItemConfig,
      ]
    : []),
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
