import * as stylex from '@stylexjs/stylex';

import { styles } from './MagnifyingGlass.stylex';

export const MagnifyingGlass = () => (
  <g {...stylex.props(styles.magnifierGroup)}>
    <circle {...stylex.props(styles.lensFill)} cx='170' cy='120' r='22' />
    <circle {...stylex.props(styles.lensStroke)} cx='170' cy='120' r='22' />
    <line
      {...stylex.props(styles.emptyHint)}
      x1='161'
      x2='179'
      y1='120'
      y2='120'
    />
    <line
      {...stylex.props(styles.handle)}
      x1='187'
      x2='204'
      y1='137'
      y2='154'
    />
  </g>
);
