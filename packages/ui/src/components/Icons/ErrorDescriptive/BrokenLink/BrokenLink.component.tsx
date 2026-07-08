import * as stylex from '@stylexjs/stylex';

import { styles } from './BrokenLink.stylex';

/** Connecting link between the two illustrations, with an animated crack, for `ErrorDescriptive`. */
export const BrokenLink = () => (
  <g {...stylex.props(styles.linkGroup)} fill='none'>
    <path {...stylex.props(styles.link)} d='M150 100 L210 100' opacity='0.55' />
    {/* animated crack segments */}
    <path
      {...stylex.props(styles.crack)}
      d='M178 88 L186 100 L178 112'
      opacity='1'
    />
    <path
      {...stylex.props(styles.crack)}
      d='M182 92 L190 104 L182 116'
      opacity='0.6'
    />
  </g>
);
