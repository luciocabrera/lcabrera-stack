import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { FloatingParticles } from './FloatingParticles';
import { MagnifyingGlass } from './MagnifyingGlass';
import { styles } from './NoDataDescriptive.stylex';
import { PulseHalo } from './PulseHalo';
import { TableSheet } from './TableSheet';

/**
 * Theme-adaptive, accessible, animated SVG illustration for empty / no-data
 * states inside a table body.
 * - Uses `currentColor` throughout so it blends with any UI theme.
 * - Respects `prefers-reduced-motion`.
 */
export const NoDataDescriptive = () => {
  const titleId = useId();
  const descId = useId();

  return (
    <svg
      {...stylex.props(styles.svg)}
      aria-labelledby={`${titleId} ${descId}`}
      height='100%'
      role='img'
      viewBox='0 0 360 220'
      width='100%'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title id={titleId}>No data found</title>
      <desc id={descId}>
        An empty table sheet with a magnifying glass, indicating that no records
        matched.
      </desc>

      <PulseHalo />
      <TableSheet />
      <MagnifyingGlass />
      <FloatingParticles />
    </svg>
  );
};
