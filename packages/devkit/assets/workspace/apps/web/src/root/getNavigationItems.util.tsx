import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';

import { FileTextIcon } from '@lcabrera/ui/components/Icons';

export const getNavigationItems = (
  iconSize: number,
): readonly NavbarItemConfig[] => [
  {
    end: true,
    icon: <FileTextIcon size={iconSize} />,
    label: 'Orders',
    to: '/',
    type: 'link',
    variant: 'primary',
  },
];
