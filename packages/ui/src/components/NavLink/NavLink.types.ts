import type { StyleXStyles } from '@stylexjs/stylex';
import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '#ui/types/design-system.types';

export type NavLinkProps = Omit<RouterNavLinkProps, 'children' | 'color'> &
  (
    | {
        /** An inline link's text is its accessible name, so it cannot be icon-only. */
        readonly isIconOnly?: false;
        readonly variant: 'inline';
      }
    | {
        readonly isIconOnly?: boolean;
        readonly variant?: DesignSystemColor;
      }
  ) & {
    readonly children: ReactNode;
    readonly customStylex?: StyleXStyles;
    readonly icon?: ReactNode;
    /** Replaces the router's pathname match for `aria-current` and the active style, and turns off the pending style; unset, the router decides. */
    readonly isActive?: boolean;
    readonly isBusy?: boolean;
    /** Ignored by the `inline` variant, which flows with the surrounding text. */
    readonly orientation?: DesignSystemOrientation;
    /** Ignored by the `inline` variant, which takes the surrounding font size. */
    readonly size?: DesignSystemSize;
    readonly tooltipContent?: ReactNode;
    readonly tooltipPlacement?: 'bottom' | 'left' | 'right' | 'top';
  };

export type NavLinkVariant = NonNullable<NavLinkProps['variant']>;
