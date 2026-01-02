import * as stylex from '@stylexjs/stylex';

import type { LoadingMoreRowProps } from './LoadingMoreRow.types';

import { styles } from './LoadingMoreRow.stylex';

/**
 * Loading indicator row shown at bottom of table during infinite scroll
 *
 * Displays a shimmer effect and optional progress text.
 */
export const LoadingMoreRow = ({
  colSpan,
  currentCount,
  totalCount,
}: LoadingMoreRowProps) => (
  <tr {...stylex.props(styles.row)}>
    <td colSpan={colSpan} {...stylex.props(styles.cell)}>
      <div {...stylex.props(styles.container)}>
        <div {...stylex.props(styles.shimmer)}>
          <div {...stylex.props(styles.shimmerOverlay)} />
        </div>
        <span {...stylex.props(styles.text)}>
          Loading more data...
          {totalCount && currentCount && (
            <span {...stylex.props(styles.count)}>
              {' '}
              ({currentCount.toLocaleString()} of {totalCount.toLocaleString()})
            </span>
          )}
        </span>
      </div>
    </td>
  </tr>
);
