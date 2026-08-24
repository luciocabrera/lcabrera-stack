import * as stylex from '@stylexjs/stylex';

import { styles } from './ConnectionPulse.stylex';

export const ConnectionPulse = () => (
  <g {...stylex.props(styles.pulseCircle)}>
    <circle {...stylex.props(styles.pulse)} cx='180' cy='100' r='36' />
  </g>
);
