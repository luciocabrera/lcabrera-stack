import * as stylex from '@stylexjs/stylex';

import { styles } from './NoDataDescriptive.stylex';

/**
 * Theme-adaptive, accessible, animated SVG illustration for empty / no-data
 * states inside a table body.
 * - Uses `currentColor` throughout so it blends with any UI theme.
 * - Respects `prefers-reduced-motion`.
 */
export const NoDataDescriptive = () => {
  return (
    <svg
      {...stylex.props(styles.svg)}
      aria-labelledby='noDataTitle noDataDesc'
      height='100%'
      role='img'
      viewBox='0 0 360 220'
      width='100%'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title id='noDataTitle'>No data found</title>
      <desc id='noDataDesc'>
        An empty table sheet with a magnifying glass, indicating that no records
        matched.
      </desc>

      {/* soft pulse behind the sheet */}
      <g {...stylex.props(styles.pulseCircle)}>
        <circle {...stylex.props(styles.pulse)} cx='180' cy='112' r='54' />
      </g>

      {/* the table sheet */}
      <g transform='translate(0,0)'>
        <rect
          {...stylex.props(styles.sheetFill)}
          height='132'
          rx='12'
          width='168'
          x='96'
          y='44'
        />

        {/* header divider */}
        <line
          {...stylex.props(styles.sheetDetail)}
          x1='96'
          x2='264'
          y1='76'
          y2='76'
        />

        {/* header cells */}
        <rect
          {...stylex.props(styles.headerCell)}
          height='8'
          rx='4'
          width='30'
          x='114'
          y='56'
        />
        <rect
          {...stylex.props(styles.headerCell)}
          height='8'
          rx='4'
          width='40'
          x='156'
          y='56'
        />
        <rect
          {...stylex.props(styles.headerCell)}
          height='8'
          rx='4'
          width='30'
          x='210'
          y='56'
        />

        {/* empty body area (dashed) */}
        <rect
          {...stylex.props(styles.dashedBody)}
          height='68'
          rx='8'
          width='136'
          x='112'
          y='92'
        />
      </g>

      {/* magnifying glass — "no results" */}
      <g {...stylex.props(styles.magnifierGroup)}>
        <circle {...stylex.props(styles.lensFill)} cx='170' cy='120' r='22' />
        <circle {...stylex.props(styles.lensStroke)} cx='170' cy='120' r='22' />
        {/* subtle empty hint inside the lens */}
        <line
          {...stylex.props(styles.sheetDetail)}
          x1='161'
          x2='179'
          y1='120'
          y2='120'
        />
        {/* handle */}
        <line
          {...stylex.props(styles.handle)}
          x1='187'
          x2='204'
          y1='137'
          y2='154'
        />
      </g>

      {/* floating particles imply "nothing here" */}
      <g {...stylex.props(styles.driftGroup)} fill='currentColor'>
        <circle cx='128' cy='34' fillOpacity='0.7' r='2.6' />
        <circle cx='180' cy='26' fillOpacity='0.5' r='2' />
        <circle cx='232' cy='36' fillOpacity='0.6' r='2.4' />
      </g>
    </svg>
  );
};
