import type { ToolbarItemConfig } from '@repo/ui/components/Toolbar/Toolbar.types';

import { ListAllIcon } from '@repo/ui/components/Icons';

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
];
