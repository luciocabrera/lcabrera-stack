import * as stylex from '@stylexjs/stylex';

import type { TrendSparklineProps } from './TrendSparkline.types';

import { styles } from './TrendSparkline.stylex';
import { getSparklinePoints } from './utils';

export const TrendSparkline = ({
  height = 24,
  label,
  tone = 'neutral',
  values,
  width = 100,
}: TrendSparklineProps) => {
  const points = getSparklinePoints({ height, values, width });

  return (
    <svg
      aria-hidden={values.length === 0}
      height={height}
      role={values.length > 0 ? 'img' : undefined}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <title>{label}</title>
      {points && (
        <polyline
          points={points}
          {...stylex.props(styles.line, styles.tone[tone])}
        />
      )}
    </svg>
  );
};
