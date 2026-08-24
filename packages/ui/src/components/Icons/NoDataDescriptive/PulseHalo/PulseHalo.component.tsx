import * as stylex from '@stylexjs/stylex';

import { styles } from './PulseHalo.stylex';

export const PulseHalo = () => (
  <g {...stylex.props(styles.pulseCircle)}>
    <circle {...stylex.props(styles.pulse)} cx='180' cy='112' r='54' />
  </g>
);
