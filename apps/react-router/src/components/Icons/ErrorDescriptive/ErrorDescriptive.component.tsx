import * as stylex from '@stylexjs/stylex';

import { styles } from './ErrorDescriptive.stylex';

/**
 * Theme-adaptive, accessible, animated SVG illustrations for error / empty states.
 * - Uses `color` prop (or inherited color) so it blends with any UI theme.
 * - Respects prefers-reduced-motion.
 */
export const ErrorDescriptive = () => {
  return (
    <svg
      {...stylex.props(styles.svg)}
      aria-labelledby='errTitle errDesc'
      height='100%'
      role='img'
      viewBox='0 0 360 220'
      width='100%'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title id='errTitle'>Data fetch error</title>
      <desc id='errDesc'>
        Two data blocks with a breaking link and a subtle warning badge
        indicating a fetch error.
      </desc>

      {/* left: stylized server / database rack */}
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
          <circle
            cx='0'
            cy='5'
            fill='currentColor'
            fillOpacity='0.95'
            r='2.6'
          />
          <circle
            cx='14'
            cy='5'
            fill='currentColor'
            fillOpacity='0.6'
            r='2.6'
          />
          <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
        </g>
        <g {...stylex.props(styles.serverDetail)} transform='translate(10,28)'>
          <circle
            cx='0'
            cy='5'
            fill='currentColor'
            fillOpacity='0.95'
            r='2.6'
          />
          <circle
            cx='14'
            cy='5'
            fill='currentColor'
            fillOpacity='0.6'
            r='2.6'
          />
          <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
        </g>
        <g {...stylex.props(styles.serverDetail)} transform='translate(10,52)'>
          <circle
            cx='0'
            cy='5'
            fill='currentColor'
            fillOpacity='0.95'
            r='2.6'
          />
          <circle
            cx='14'
            cy='5'
            fill='currentColor'
            fillOpacity='0.6'
            r='2.6'
          />
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

      {/* right: stylized laptop / client */}
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

      {/* soft pulse behind the link */}
      <g {...stylex.props(styles.pulseCircle)}>
        <circle {...stylex.props(styles.pulse)} cx='180' cy='100' r='36' />
      </g>

      {/* connecting link with animated crack */}
      <g {...stylex.props(styles.linkGroup)} fill='none'>
        <path
          {...stylex.props(styles.link)}
          d='M150 100 L210 100'
          opacity='0.55'
        />
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

      {/* small particles to imply disruption */}
      <g fill='currentColor' fillOpacity='0.9'>
        <circle cx='170' cy='78' opacity='0.9' r='2.2' />
        <circle cx='190' cy='122' opacity='0.7' r='1.8' />
        <circle cx='160' cy='110' opacity='0.6' r='1.6' />
      </g>

      <g {...stylex.props(styles.badgeGroup)} transform='translate(240,70)'>
        <circle {...stylex.props(styles.badge)} cx='0' cy='0' r='14' />
        <rect fill='currentColor' height='8' rx='1' width='3' x='-1.5' y='-6' />
        <circle cx='0' cy='6' fill='currentColor' r='2.2' />
      </g>
    </svg>
  );
};
