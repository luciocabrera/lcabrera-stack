import * as stylex from '@stylexjs/stylex';

import type { TrendSparklineProps } from './TrendSparkline.types';

import { styles } from './TrendSparkline.stylex';
import { TrendSparklineDot } from './TrendSparklineDot/TrendSparklineDot.component';
import { getTrendPointsGeometry, getTrendValuesLine } from './utils';

export const TrendSparkline = ({
  height = 24,
  isConnected = true,
  label,
  max,
  tone = 'neutral',
  width = 100,
  ...series
}: TrendSparklineProps) => {
  const { dots, line } =
    series.points === undefined
      ? {
          dots: [],
          line: getTrendValuesLine({
            height,
            max,
            values: series.values,
            width,
          }),
        }
      : getTrendPointsGeometry({
          height,
          isConnected,
          max,
          points: series.points,
          width,
        });
  const isEmpty = line === '' && dots.length === 0;
  const populatedRole = dots.some(({ to }) => to !== undefined)
    ? 'group'
    : 'img';

  return (
    <svg
      aria-hidden={isEmpty}
      height={height}
      role={isEmpty ? undefined : populatedRole}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
    >
      <title>{label}</title>
      {line !== '' && (
        <path d={line} {...stylex.props(styles.line, styles.tone[tone])} />
      )}
      {dots.map((dot) => (
        <TrendSparklineDot
          key={dot.position}
          {...dot}
          tone={dot.tone ?? tone}
        />
      ))}
    </svg>
  );
};
