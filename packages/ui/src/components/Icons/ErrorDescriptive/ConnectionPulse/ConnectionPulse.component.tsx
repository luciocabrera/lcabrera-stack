import * as stylex from '@stylexjs/stylex';

import { styles } from './ConnectionPulse.stylex';

/** Soft pulsing halo rendered behind the connecting link in `ErrorDescriptive`. */
export const ConnectionPulse = () => (
  <g {...stylex.props(styles.pulseCircle)}>
    <circle {...stylex.props(styles.pulse)} cx='180' cy='100' r='36' />
  </g>
);
