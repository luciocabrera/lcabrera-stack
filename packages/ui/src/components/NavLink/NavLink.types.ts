import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '#ui/types/design-system.types';

export type NavLinkProps = Omit<RouterNavLinkProps, 'children' | 'color'> & {
  readonly children: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly isActive?: boolean;
  readonly isBusy?: boolean;
  readonly isIconOnly?: boolean;
  /** Ignored by the `inline` variant, which flows with the surrounding text. */
  readonly orientation?: DesignSystemOrientation;
  /** Ignored by the `inline` variant, which takes the surrounding font size. */
  readonly size?: DesignSystemSize;
  readonly tooltipContent?: ReactNode;
  readonly tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  readonly variant?: NavLinkVariant;
};

export type NavLinkVariant = 'inline' | DesignSystemColor;
