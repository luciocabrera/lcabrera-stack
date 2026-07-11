import * as stylex from '@stylexjs/stylex';

import { styles } from './FloatingParticles.stylex';

/** Drifting particles above the sheet implying "nothing here" in `NoDataDescriptive`. */
export const FloatingParticles = () => (
  <g {...stylex.props(styles.driftGroup)} fill='currentColor'>
    <circle cx='128' cy='34' fillOpacity='0.7' r='2.6' />
    <circle cx='180' cy='26' fillOpacity='0.5' r='2' />
    <circle cx='232' cy='36' fillOpacity='0.6' r='2.4' />
  </g>
);
