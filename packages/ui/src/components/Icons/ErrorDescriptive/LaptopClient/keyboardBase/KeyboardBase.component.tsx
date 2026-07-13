import * as stylex from '@stylexjs/stylex';

import { styles } from '../LaptopClient.stylex';

export const KeyboardBase = () => (
  <g transform='translate(0,62)'>
    <rect
      {...stylex.props(styles.laptopFill)}
      height='12'
      rx='4'
      width='98'
      x='6'
      y='0'
    />
    <g {...stylex.props(styles.laptopDetail)} transform='translate(14,4)'>
      <rect fill='none' height='4' rx='2' width='72' x='0' y='0' />
      {/* small keys hint */}
      <rect
        fill='currentColor'
        fillOpacity='0.12'
        height='2'
        rx='1'
        width='8'
        x='0'
        y='8'
      />
      <rect
        fill='currentColor'
        fillOpacity='0.12'
        height='2'
        rx='1'
        width='8'
        x='12'
        y='8'
      />
      <rect
        fill='currentColor'
        fillOpacity='0.12'
        height='2'
        rx='1'
        width='8'
        x='24'
        y='8'
      />
      <rect
        fill='currentColor'
        fillOpacity='0.12'
        height='2'
        rx='1'
        width='8'
        x='36'
        y='8'
      />
      <rect
        fill='currentColor'
        fillOpacity='0.12'
        height='2'
        rx='1'
        width='8'
        x='48'
        y='8'
      />
      <rect
        fill='currentColor'
        fillOpacity='0.12'
        height='2'
        rx='1'
        width='8'
        x='60'
        y='8'
      />
    </g>
  </g>
);
