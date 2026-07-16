import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';
import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

export type NavLinkProps = Omit<RouterNavLinkProps, 'children' | 'color'> & {
  readonly children: ReactNode;
  readonly customStylex?: StyleXStyles;
  readonly icon?: ReactNode;
  readonly isActive?: boolean;
  /** When true, renders the shimmer busy overlay and makes the link non-interactive (matches `Button`'s `isBusy`). */
  readonly isBusy?: boolean;
  readonly isIconOnly?: boolean;
  readonly orientation?: DesignSystemOrientation;
  readonly size?: DesignSystemSize;
  readonly tooltipContent?: ReactNode;
  readonly tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  readonly variant?: DesignSystemColor;
};
