import * as stylex from '@stylexjs/stylex';

import { skeletonStyles, styles } from './SkeletonOptions.stylex';

const SKELETON_ROW_COUNT = 8;

export const SkeletonOptions = () => {
  const placeholders = Array.from(
    { length: SKELETON_ROW_COUNT },
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
