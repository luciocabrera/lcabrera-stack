import type {
  DesignSystemOrientation,
  DesignSystemSize,
} from '#ui/types/design-system.types';

import type { NavbarItemConfig } from '../Navbar.types';

export type NavbarItemProps = {
  readonly isCompact: boolean;
  readonly item: NavbarItemConfig;
  readonly orientation: DesignSystemOrientation;
  readonly size: DesignSystemSize;
};
