import * as stylex from '@stylexjs/stylex';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
  DesignSystemWidth,
} from '@/types/design-system.types';

import type { linkItemStyles } from '../NavLink.stylex';

type GetClassNameArgs = {
  color: DesignSystemColor;
  isActive: boolean;
  orientation: DesignSystemOrientation;
  size: DesignSystemSize;
  styles: typeof linkItemStyles;
  width?: DesignSystemWidth;
};

export const getClassName = ({
  color,
  isActive,
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
  ).className ?? '';
