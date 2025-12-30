import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '@/types/design-system.types';

export type NavLinkProps = Omit<RouterNavLinkProps, 'children'> & {
  children: ReactNode;
  color?: DesignSystemColor;
  icon?: ReactNode;
  isActive?: boolean;
  orientation?: DesignSystemOrientation;
  size?: DesignSystemSize;
};
