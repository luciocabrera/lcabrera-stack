import * as stylex from '@stylexjs/stylex';

import type { StyleXStyles } from '@stylexjs/stylex';
import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemWidth,
} from '@/types/design-system.types';

import type { linkItemStyles } from '../NavLink.stylex';

type GetClassNameArgs = {
  readonly color: DesignSystemColor;
  readonly customStylex?: StyleXStyles;
  readonly isActive: boolean;
  readonly isIconOnly?: boolean;
  readonly orientation: DesignSystemOrientation;
  readonly size: DesignSystemSize;
  readonly styles: typeof linkItemStyles;
  readonly width?: DesignSystemWidth;
};

export const getClassName = ({
  color,
  customStylex,
  isActive,
  isIconOnly = false,
  orientation,
  size,
  styles,
  width = 'auto',
}: GetClassNameArgs) =>
  stylex.props(
    styles.base,
    styles.orientation[orientation],
    styles.size[size],
    styles.color[color],
    styles.width[width],
    isActive && styles.active,
    isIconOnly && styles.iconOnly,
    customStylex,
  ).className ?? '';
