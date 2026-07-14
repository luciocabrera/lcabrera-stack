import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemWidth,
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
  readonly width?: DesignSystemWidth;
};

export const getClassName = ({
  customStylex,
  isActive,
  isIconOnly = false,
  orientation,
  size,
  styles,
  variant,
  width = 'auto',
}: GetClassNameArgs) =>
  stylex.props(
    styles.base,
    styles.orientation[orientation],
    styles.size[size],
    styles.variant[variant],
    styles.width[width],
    isActive && styles.active,
    isIconOnly && styles.iconOnly,
    customStylex,
  ).className ?? '';
