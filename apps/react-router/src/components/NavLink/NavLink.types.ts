import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemWidth,
} from '@/types/design-system.types';

export type NavLinkProps = Omit<RouterNavLinkProps, 'children'> & {
  readonly children: ReactNode;
  readonly color?: DesignSystemColor;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly isActive?: boolean;
  readonly isIconOnly?: boolean;
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
  readonly tooltipContent?: ReactNode;
  readonly tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  readonly width?: DesignSystemWidth;
};
