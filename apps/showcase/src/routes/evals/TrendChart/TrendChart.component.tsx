import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { TrendChartProps } from './TrendChart.types';

import { TREND_CHART_SIZE } from './TrendChart.constants';
import { styles } from './TrendChart.stylex';
import { trendGeometry } from './trendGeometry.util';

export const TrendChart = ({ label, marks, points }: TrendChartProps) => {
  const geometry = trendGeometry({
    height: TREND_CHART_SIZE.height,
    marks,
    padding: TREND_CHART_SIZE.padding,
    points,
    width: TREND_CHART_SIZE.width,
  });

  return (
    <figure aria-label={label} {...stylex.props(styles.figure)}>
      <svg
        viewBox={`0 0 ${String(TREND_CHART_SIZE.width)} ${String(TREND_CHART_SIZE.height)}`}
        width={TREND_CHART_SIZE.width}
        {...stylex.props(styles.chart)}
      >
        <title>{label}</title>
        <text x={0} y={geometry.top} {...stylex.props(styles.axis)}>
          100%
        </text>
        <text x={0} y={geometry.bottom} {...stylex.props(styles.axis)}>
          0%
        </text>
        {points.length > 1 && (
          <polygon points={geometry.band} {...stylex.props(styles.band)} />
        )}
        {geometry.marks.map((mark) => (
          <line
            key={mark.key}
            x1={mark.x}
            x2={mark.x}
            y1={geometry.top}
            y2={geometry.bottom}
            {...stylex.props(styles.mark, styles[mark.kind])}
          >
            <title>{mark.label}</title>
          </line>
        ))}
        {points.length > 1 && (
          <polyline points={geometry.line} {...stylex.props(styles.line)} />
        )}
        {geometry.dots.map((dot) => (
          <Link aria-label={dot.label} key={dot.key} to={dot.href}>
            <title>{dot.label}</title>
            <circle
              cx={dot.cx}
              cy={dot.cy}
              r={TREND_CHART_SIZE.dotRadius}
              {...stylex.props(styles.dot)}
            />
          </Link>
        ))}
      </svg>
    </figure>
  );
};
