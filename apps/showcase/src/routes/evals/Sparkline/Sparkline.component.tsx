import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { SparklineProps } from './Sparkline.types';

import { SPARKLINE_SIZE } from './Sparkline.constants';
import { styles } from './Sparkline.stylex';
import { sparklineGeometry } from './sparklineGeometry.util';

export const Sparkline = ({
  isConnected = true,
  label,
  maxValue,
  points,
}: SparklineProps) => {
  const { dots, line } = sparklineGeometry({
    height: SPARKLINE_SIZE.height,
    padding: SPARKLINE_SIZE.padding,
    points,
    width: SPARKLINE_SIZE.width,
    ...(maxValue !== undefined && { maxValue }),
  });

  return (
    <figure aria-label={label} {...stylex.props(styles.figure)}>
      <svg
        viewBox={`0 0 ${String(SPARKLINE_SIZE.width)} ${String(SPARKLINE_SIZE.height)}`}
        width={SPARKLINE_SIZE.width}
        {...stylex.props(styles.chart)}
      >
        <title>{label}</title>
        {isConnected && dots.length > 1 && (
          <polyline points={line} {...stylex.props(styles.line)} />
        )}
        {dots.map((dot) => (
          <Link aria-label={dot.label} key={dot.key} to={dot.href}>
            <title>{dot.label}</title>
            <circle
              cx={dot.cx}
              cy={dot.cy}
              r={SPARKLINE_SIZE.dotRadius}
              {...stylex.props(styles.dot, dot.tone && styles[dot.tone])}
            />
          </Link>
        ))}
      </svg>
    </figure>
  );
};
