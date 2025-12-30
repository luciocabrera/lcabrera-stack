import * as stylex from '@stylexjs/stylex';

import type { TableOverlayProps } from './TableOverlay.types';

import { tableOverlayStyles } from './TableOverlay.stylex';

/**
 * Semi-transparent pulsing overlay for table loading state
 *
 * Covers the entire table with a translucent overlay that pulses,
 * allowing the underlying table structure (headers) to be visible
 * but clearly indicating a loading state.
 */
export const TableOverlay = ({ isVisible }: TableOverlayProps) => {
  if (!isVisible) return;

  return (
    <div
      aria-busy='true'
      aria-label='Loading table data'
      role='status'
      {...stylex.props(tableOverlayStyles.overlay)}
    />
  );
};
