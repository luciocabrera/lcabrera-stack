import type { ToolbarItemConfig } from '@repo/ui/components/Toolbar/Toolbar.types';

import {
  BarChartIcon,
  ListAllIcon,
  ListCheckedIcon,
  LockIcon,
  SettingsIcon,
} from '@repo/ui/components/Icons';

/**
 * Returns navigation items with icons scaled to the given size.
 */
export const getNavigationItems = (
  iconSize: number,
): readonly ToolbarItemConfig[] => [
  {
    color: 'primary',
    end: true,
    icon: <ListAllIcon size={iconSize} />,
    label: 'Projects',
    to: '/cqms',
    type: 'link',
  },
  {
    icon: <ListCheckedIcon size={iconSize} />,
    label: 'Scanners',
    to: '/cqms/scanners',
    type: 'link',
  },
  {
    icon: <LockIcon size={iconSize} />,
    label: 'Users',
    to: '/cqms/admin/users',
    type: 'link',
  },
  {
    icon: <LockIcon size={iconSize} />,
    label: 'Roles',
    to: '/cqms/admin/roles',
    type: 'link',
  },
  {
    icon: <BarChartIcon size={iconSize} />,
    label: 'LLM Usage',
    to: '/cqms/admin/llm-usage',
    type: 'link',
  },
  {
    icon: <SettingsIcon size={iconSize} />,
    label: 'Settings',
    to: '/settings',
    type: 'link',
  },
];
