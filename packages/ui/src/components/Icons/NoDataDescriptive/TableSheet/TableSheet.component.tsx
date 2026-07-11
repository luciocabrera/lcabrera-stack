import * as stylex from '@stylexjs/stylex';

import { styles } from './TableSheet.stylex';

/** Empty table sheet with header cells and a dashed body, the central element of `NoDataDescriptive`. */
export const TableSheet = () => (
  <g>
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
);
