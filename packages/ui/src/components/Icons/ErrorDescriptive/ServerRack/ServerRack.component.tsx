import * as stylex from '@stylexjs/stylex';

import { styles } from './ServerRack.stylex';

export const ServerRack = () => (
  <g transform='translate(28,62)'>
    {/* server body (stacked panels) */}
    <rect
      {...stylex.props(styles.serverFill)}
      height='18'
      rx='6'
      width='110'
      x='0'
      y='0'
    />
    <rect
      {...stylex.props(styles.serverFill)}
      height='18'
      rx='6'
      width='110'
      x='0'
      y='24'
    />
    <rect
      {...stylex.props(styles.serverFill)}
      height='18'
      rx='6'
      width='110'
      x='0'
      y='48'
    />
    {/* front panel details */}
    <g {...stylex.props(styles.serverDetail)} transform='translate(10,4)'>
      <circle cx='0' cy='5' fill='currentColor' fillOpacity='0.95' r='2.6' />
      <circle cx='14' cy='5' fill='currentColor' fillOpacity='0.6' r='2.6' />
      <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
    </g>
    <g {...stylex.props(styles.serverDetail)} transform='translate(10,28)'>
      <circle cx='0' cy='5' fill='currentColor' fillOpacity='0.95' r='2.6' />
      <circle cx='14' cy='5' fill='currentColor' fillOpacity='0.6' r='2.6' />
      <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
    </g>
    <g {...stylex.props(styles.serverDetail)} transform='translate(10,52)'>
      <circle cx='0' cy='5' fill='currentColor' fillOpacity='0.95' r='2.6' />
      <circle cx='14' cy='5' fill='currentColor' fillOpacity='0.6' r='2.6' />
      <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
    </g>

    {/* subtle database cylinder hint on the left edge */}
    <g transform='translate(-8,6)'>
      <ellipse
        cx='8'
        cy='3'
        fill='currentColor'
        fillOpacity='0.06'
        rx='8'
        ry='3.6'
      />
      <rect
        fill='currentColor'
        fillOpacity='0.04'
        height='54'
        rx='4'
        width='16'
        x='0'
        y='3'
      />
      <ellipse
        cx='8'
        cy='57'
        fill='currentColor'
        fillOpacity='0.06'
        rx='8'
        ry='3.6'
      />
    </g>
  </g>
);
