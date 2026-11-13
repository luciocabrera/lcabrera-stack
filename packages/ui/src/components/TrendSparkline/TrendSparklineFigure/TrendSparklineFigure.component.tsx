import * as stylex from '@stylexjs/stylex';

import type { TrendSparklineFigureProps } from '#ui/components/TrendSparkline/TrendSparkline.types';

import { scaleByDensity } from '#ui/components/ChartSettings/utils/scaleByDensity.util';

import { styles } from '../TrendSparkline.stylex';
import { TrendSparklineDot } from '../TrendSparklineDot/TrendSparklineDot.component';
import { getTrendPointsGeometry, getTrendValuesLine } from '../utils';

export const TrendSparklineFigure = ({
  emptyRole,
  height: compactHeight = 24,
  label,
  max,
  settings,
  tone = 'neutral',
  width = 100,
  ...series
}: TrendSparklineFigureProps) => {
  const height = scaleByDensity({
    density: settings.density,
    size: compactHeight,
  });
  const isConnected = settings.isConnected === true;
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
      aria-hidden={isEmpty && emptyRole === undefined}
      height={height}
      role={isEmpty ? emptyRole : populatedRole}
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width={width}
    >
      <title>{label}</title>
      {line !== '' && (
        <path d={line} {...stylex.props(styles.line, styles.tone[tone])} />
      )}
      {dots.map(({ position, ...dot }) => (
        <TrendSparklineDot key={position} {...dot} tone={dot.tone ?? tone} />
      ))}
    </svg>
  );
};
