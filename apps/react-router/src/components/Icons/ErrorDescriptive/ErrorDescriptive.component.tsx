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
      <style>{`
            :root { --accent: currentColor; }
            .serverFill { fill: var(--accent); fill-opacity:0.10; stroke:var(--accent); stroke-opacity:0.9; stroke-width:1.8; }
            .serverDetail { stroke:var(--accent); stroke-opacity:0.9; stroke-width:1.4; fill:none; }
            .laptopFill { fill: var(--accent); fill-opacity:0.10; stroke:var(--accent); stroke-opacity:0.9; stroke-width:1.8; }
            .laptopDetail { stroke:var(--accent); stroke-opacity:0.9; stroke-width:1.4; fill:none; }
            .link { stroke:var(--accent); stroke-width:3.5; stroke-linecap:round; stroke-linejoin:round; stroke-opacity:0.9; }
            .crack { stroke:var(--accent); stroke-width:3.5; stroke-linecap:round; stroke-linejoin:round; stroke-opacity:0.95; }
            .badge { fill:var(--accent); }
            .pulse { fill:var(--accent); fill-opacity:0.08; }
            @keyframes shake {
              0% { transform: translateX(0); }
              20% { transform: translateX(-3px); }
              40% { transform: translateX(3px); }
              60% { transform: translateX(-2px); }
              80% { transform: translateX(2px); }
              100% { transform: translateX(0); }
            }
            @keyframes pulseScale {
              0% { transform: scale(0.9); opacity:0.18; }
              50% { transform: scale(1.15); opacity:0.06; }
              100% { transform: scale(0.9); opacity:0.18; }
            }
            @keyframes badgeBounce {
              0% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
              100% { transform: translateY(0); }
            }
            .linkGroup { transform-origin: 180px 110px; animation: shake 1.6s ease-in-out infinite; }
            .pulseCircle { transform-origin: 180px 110px; animation: pulseScale 2.2s ease-in-out infinite; }
            .badgeGroup { animation: badgeBounce 2s ease-in-out infinite; transform-origin: 240px 70px; }
            @media (prefers-reduced-motion: reduce) {
              .linkGroup, .pulseCircle, .badgeGroup { animation: none; }
            }
          `}</style>
      {/* <style>{`
            :root { --error: currentColor; }
            .block { fill: var(--error); fill-opacity:0.12; stroke:var(--error); stroke-opacity:0.9; stroke-width:2; rx:10; }
            .link { stroke:var(--error); stroke-width:3.5; stroke-linecap:round; stroke-linejoin:round; stroke-opacity:0.9; }
            .crack { stroke:var(--error); stroke-width:3.5; stroke-linecap:round; stroke-linejoin:round; stroke-opacity:0.95; }
            .badge { fill:var(--error); }
            .pulse { fill:var(--error); fill-opacity:0.08; }
            @keyframes shake {
              0% { transform: translateX(0); }
              20% { transform: translateX(-3px); }
              40% { transform: translateX(3px); }
              60% { transform: translateX(-2px); }
              80% { transform: translateX(2px); }
              100% { transform: translateX(0); }
            }
            @keyframes pulseScale {
              0% { transform: scale(0.9); opacity:0.18; }
              50% { transform: scale(1.15); opacity:0.06; }
              100% { transform: scale(0.9); opacity:0.18; }
            }
            @keyframes badgeBounce {
              0% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
              100% { transform: translateY(0); }
            }
            .linkGroup { transform-origin: 180px 110px; animation: shake 1.6s ease-in-out infinite; }
            .pulseCircle { transform-origin: 180px 110px; animation: pulseScale 2.2s ease-in-out infinite; }
            .badgeGroup { animation: badgeBounce 2s ease-in-out infinite; transform-origin: 240px 70px; }
            @media (prefers-reduced-motion: reduce) {
              .linkGroup, .pulseCircle, .badgeGroup { animation: none; }
            }
          `}</style> */}

      {/* left data block */}
      {/* <rect className='block' x='40' y='70' width='110' height='60' rx='10' />
      <g
        transform='translate(60,92)'
        stroke='var(--error)'
        strokeOpacity='0.9'
        strokeWidth='1.6'
        fill='none'
      >
        <rect x='0' y='0' width='70' height='26' rx='6' fill='none' />
      </g> */}

      {/* right data block */}
      {/* <rect className='block' x='210' y='70' width='110' height='60' rx='10' />
      <g
        transform='translate(230,92)'
        stroke='var(--error)'
        strokeOpacity='0.9'
        strokeWidth='1.6'
        fill='none'
      >
        <rect x='0' y='0' width='70' height='26' rx='6' fill='none' />
      </g> */}

      {/* left: stylized server / database rack */}
      <g transform='translate(28,62)'>
        {/* server body (stacked panels) */}
        <rect
          className='serverFill'
          height='18'
          rx='6'
          width='110'
          x='0'
          y='0'
        />
        <rect
          className='serverFill'
          height='18'
          rx='6'
          width='110'
          x='0'
          y='24'
        />
        <rect
          className='serverFill'
          height='18'
          rx='6'
          width='110'
          x='0'
          y='48'
        />
        {/* front panel details */}
        <g className='serverDetail' transform='translate(10,4)'>
          <circle
            cx='0'
            cy='5'
            fill='var(--accent)'
            fillOpacity='0.95'
            r='2.6'
          />
          <circle
            cx='14'
            cy='5'
            fill='var(--accent)'
            fillOpacity='0.6'
            r='2.6'
          />
          <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
        </g>
        <g className='serverDetail' transform='translate(10,28)'>
          <circle
            cx='0'
            cy='5'
            fill='var(--accent)'
            fillOpacity='0.95'
            r='2.6'
          />
          <circle
            cx='14'
            cy='5'
            fill='var(--accent)'
            fillOpacity='0.6'
            r='2.6'
          />
          <rect fill='none' height='12' rx='3' width='56' x='36' y='-3' />
        </g>
        <g className='serverDetail' transform='translate(10,52)'>
          <circle
            cx='0'
            cy='5'
            fill='var(--accent)'
            fillOpacity='0.95'
            r='2.6'
          />
          <circle
            cx='14'
            cy='5'
            fill='var(--accent)'
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
            fill='var(--accent)'
            fillOpacity='0.06'
            rx='8'
            ry='3.6'
          />
          <rect
            fill='var(--accent)'
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
            fill='var(--accent)'
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
          className='laptopFill'
          height='60'
          rx='8'
          width='110'
          x='0'
          y='0'
        />
        <rect
          className='laptopDetail'
          height='36'
          rx='4'
          width='94'
          x='8'
          y='8'
        />
        {/* keyboard base */}
        <g transform='translate(0,62)'>
          <rect
            className='laptopFill'
            height='12'
            rx='4'
            width='98'
            x='6'
            y='0'
          />
          <g className='laptopDetail' transform='translate(14,4)'>
            <rect fill='none' height='4' rx='2' width='72' x='0' y='0' />
            {/* small keys hint */}
            <rect
              fill='var(--accent)'
              fillOpacity='0.12'
              height='2'
              rx='1'
              width='8'
              x='0'
              y='8'
            />
            <rect
              fill='var(--accent)'
              fillOpacity='0.12'
              height='2'
              rx='1'
              width='8'
              x='12'
              y='8'
            />
            <rect
              fill='var(--accent)'
              fillOpacity='0.12'
              height='2'
              rx='1'
              width='8'
              x='24'
              y='8'
            />
            <rect
              fill='var(--accent)'
              fillOpacity='0.12'
              height='2'
              rx='1'
              width='8'
              x='36'
              y='8'
            />
            <rect
              fill='var(--accent)'
              fillOpacity='0.12'
              height='2'
              rx='1'
              width='8'
              x='48'
              y='8'
            />
            <rect
              fill='var(--accent)'
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
      <g className='pulseCircle'>
        <circle className='pulse' cx='180' cy='100' r='36' />
      </g>

      {/* connecting link with animated crack */}
      <g className='linkGroup' fill='none'>
        <path className='link' d='M150 100 L210 100' opacity='0.55' />
        {/* animated crack segments */}
        <path className='crack' d='M178 88 L186 100 L178 112' opacity='1' />
        <path className='crack' d='M182 92 L190 104 L182 116' opacity='0.6' />
      </g>

      {/* small particles to imply disruption */}
      <g fill='var(--accent)' fillOpacity='0.9'>
        <circle cx='170' cy='78' opacity='0.9' r='2.2' />
        <circle cx='190' cy='122' opacity='0.7' r='1.8' />
        <circle cx='160' cy='110' opacity='0.6' r='1.6' />
      </g>

      {/* warning badge */}
      {/* <g className='badgeGroup' transform='translate(240,70)'>
        <circle className='badge' cx='0' cy='0' r='14' />
        <rect x='-1.5' y='-6' width='3' height='8' rx='1' fill='#fff' />
        <circle cx='0' cy='6' r='2.2' fill='#fff' />
      </g> */}
      <g className='badgeGroup' transform='translate(240,70)'>
        <circle className='badge' cx='0' cy='0' r='14' />
        <rect
          fill='var(--accent)'
          height='8'
          rx='1'
          width='3'
          x='-1.5'
          y='-6'
        />
        <circle cx='0' cy='6' fill='var(--accent)' r='2.2' />
      </g>
    </svg>
  );
};
