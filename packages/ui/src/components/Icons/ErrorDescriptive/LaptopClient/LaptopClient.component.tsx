import * as stylex from '@stylexjs/stylex';

import { styles } from './LaptopClient.stylex';

/** Stylized laptop / client illustration used on the right of `ErrorDescriptive`. */
export const LaptopClient = () => (
  <g transform='translate(210,70)'>
    {/* screen */}
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
    {/* keyboard base */}
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
  </g>
);
