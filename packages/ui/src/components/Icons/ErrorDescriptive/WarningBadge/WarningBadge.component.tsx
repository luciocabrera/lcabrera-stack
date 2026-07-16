import * as stylex from '@stylexjs/stylex';

import { styles } from './WarningBadge.stylex';

/** Bouncing warning badge illustration rendered on top of `ErrorDescriptive`. */
export const WarningBadge = () => (
  <g {...stylex.props(styles.badgeGroup)} transform='translate(240,70)'>
    <circle {...stylex.props(styles.badge)} cx='0' cy='0' r='14' />
    <rect fill='currentColor' height='8' rx='1' width='3' x='-1.5' y='-6' />
    <circle cx='0' cy='6' fill='currentColor' r='2.2' />
  </g>
);
