import * as stylex from '@stylexjs/stylex';

import type { SkeletonOptionsProps } from './SkeletonOptions.types';

import {
  DEFAULT_SKELETON_ROW_COUNT,
  ITEM_HEIGHT,
} from '../VirtualList.constants';
import { skeletonStyles, styles } from './SkeletonOptions.stylex';

export const SkeletonOptions = ({ containerHeight }: SkeletonOptionsProps) => {
  const count =
    containerHeight && containerHeight > 0
      ? Math.floor(containerHeight / ITEM_HEIGHT)
      : DEFAULT_SKELETON_ROW_COUNT;

  const placeholders = Array.from(
    { length: count },
    // eslint-disable-next-line local-rules/destructuring-for-functions
    (_, index) => ({
      key: index,
    }),
  );
  return (
    <>
      {placeholders.map((item) => (
        <div
          key={item.key}
          {...stylex.props(styles.option, styles.optionDisabled)}
        >
          <div {...stylex.props(skeletonStyles.placeholderBar)}>
            <div {...stylex.props(skeletonStyles.shimmerWave)} />
          </div>
        </div>
      ))}
    </>
  );
};
