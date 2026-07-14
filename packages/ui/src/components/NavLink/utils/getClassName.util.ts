import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '@repo/ui/types/design-system.types';
import type { StyleXStyles } from '@stylexjs/stylex';

import * as stylex from '@stylexjs/stylex';

import type { linkItemStyles } from '../NavLink.stylex';

type GetClassNameArgs = {
  readonly customStylex?: StyleXStyles;
  readonly isActive: boolean;
  readonly isIconOnly?: boolean;
  readonly orientation: DesignSystemOrientation;
  readonly size: DesignSystemSize;
  readonly styles: typeof linkItemStyles;
  readonly variant: DesignSystemColor;
};

export const getClassName = ({
  customStylex,
  isActive,
  isIconOnly = false,
  orientation,
  size,
  styles,
  variant,
}: GetClassNameArgs) =>
  stylex.props(
    styles.base,
    styles.orientation[orientation],
    styles.size[size],
    styles.variant[variant],
    styles.fullWidth,
    isActive && styles.active,
    isIconOnly && styles.iconOnly,
    customStylex,
  ).className ?? '';
