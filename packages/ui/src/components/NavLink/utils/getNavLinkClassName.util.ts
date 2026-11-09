import type { StyleXStyles } from '@stylexjs/stylex';

import type {
  DesignSystemOrientation,
  DesignSystemSize,
} from '#ui/types/design-system.types';

import type { NavLinkVariant } from '../NavLink.types';

import { linkItemStyles } from '../NavLink.stylex';
import { getClassName } from './getClassName.util';
import { getInlineClassName } from './getInlineClassName.util';

type GetNavLinkClassNameArgs = {
  readonly customStylex?: StyleXStyles;
  readonly isActive: boolean;
  readonly isBusy: boolean;
  readonly isIconOnly: boolean;
  readonly isPending: boolean;
  readonly orientation: DesignSystemOrientation;
  readonly size: DesignSystemSize;
  readonly variant: NavLinkVariant;
};

export const getNavLinkClassName = ({
  customStylex,
  isActive,
  isBusy,
  isIconOnly,
  isPending,
  orientation,
  size,
  variant,
}: GetNavLinkClassNameArgs) =>
  variant === 'inline'
    ? getInlineClassName({
        customStylex,
        isActive,
        isBusy,
        isPending,
        styles: linkItemStyles,
      })
    : getClassName({
        customStylex,
        isActive,
        isBusy,
        isIconOnly,
        orientation,
        size,
        styles: linkItemStyles,
        variant,
      });
