import * as stylex from '@stylexjs/stylex';

import { KeyboardBase } from './keyboardBase';
import { styles } from './LaptopClient.stylex';

export const LaptopClient = () => (
  <g transform='translate(210,70)'>
    <rect
      {...stylex.props(styles.laptopFill)}
      height='60'
      rx='8'
      width='110'
      x='0'
      y='0'
    />
    <rect
      {...stylex.props(styles.laptopDetail)}
      height='36'
      rx='4'
      width='94'
      x='8'
      y='8'
    />
    <KeyboardBase />
  </g>
);
