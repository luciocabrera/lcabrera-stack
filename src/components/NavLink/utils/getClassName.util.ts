import * as stylex from '@stylexjs/stylex';

import type {
  DesignSystemColor,
  DesignSystemOrientation,
  DesignSystemSize,
} from '@/types/design-system.types';

import type { linkItemStyles } from '../NavLink.stylex';

type GetClassNameArgs = {
  color: DesignSystemColor;
  isActive: boolean;
  orientation: DesignSystemOrientation;
  size: DesignSystemSize;
  styles: typeof linkItemStyles;
};

export const getClassName = ({
  color,
  isActive,
  orientation,
  size,
  styles
}: GetClassNameArgs) =>
  stylex.props(
    styles.base,
    styles.orientation[orientation],
    styles.size[size],
    styles.color[color],
    isActive && styles.active,
  ).className ?? '';
