import * as stylex from '@stylexjs/stylex';

import { skeletonStyles, styles } from '../SelectFilterInput.stylex';

const SKELETON_ROW_COUNT = 8;

export const SkeletonOptions = () => (
  <>
    {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
      <div
        // Skeleton rows use index-based keys since they are static placeholders
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        {...stylex.props(styles.option, styles.optionDisabled)}
      >
        <div {...stylex.props(styles.checkbox)} />
        <div {...stylex.props(skeletonStyles.loadingOverlay)}>
          <div {...stylex.props(skeletonStyles.shimmerWave)} />
        </div>
      </div>
    ))}
  </>
);
