import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

export type NavLinkProps = Omit<RouterNavLinkProps, 'children'> & {
  readonly children: ReactNode;
  /** @deprecated Use `variant` instead. */
  readonly color?: DesignSystemColor;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly isActive?: boolean;
  readonly isIconOnly?: boolean;
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
  readonly tooltipContent?: ReactNode;
  readonly tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  readonly variant?: DesignSystemColor;
};
