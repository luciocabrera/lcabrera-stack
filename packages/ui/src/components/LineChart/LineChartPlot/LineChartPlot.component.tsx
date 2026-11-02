import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';
import {
  lineChartFill,
  lineChartLayout,
  lineChartStroke,
} from '#ui/components/LineChart/LineChart.stylex';
import { LineChartDot } from '#ui/components/LineChart/LineChartDot/LineChartDot.component';

import type { LineChartPlotProps } from './LineChartPlot.types';

import { lineChartPlotStyles } from './LineChartPlot.stylex';

export const LineChartPlot = ({
  description,
  geometry,
  height,
  title,
}: LineChartPlotProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const hasLinks = geometry.series.some(({ dots }) =>
    dots.some(({ to }) => to !== undefined),
  );
  const size = String(LINE_CHART.plotSize);

  return (
    <svg
      aria-describedby={description === undefined ? undefined : descriptionId}
      aria-labelledby={titleId}
      preserveAspectRatio='none'
      role={hasLinks ? 'group' : 'img'}
      viewBox={`0 0 ${size} ${size}`}
      {...stylex.props(lineChartLayout.plot(height))}
    >
      <title id={titleId}>{title}</title>
      {description !== undefined && (
        <desc id={descriptionId}>{description}</desc>
      )}
      {geometry.gridlines !== '' && (
        <path
          d={geometry.gridlines}
          {...stylex.props(lineChartPlotStyles.gridlines)}
        />
      )}
      {geometry.series
        .filter(({ band }) => band !== '')
        .map(({ band, id, tone }) => (
          <path
            d={band}
            key={id}
            {...stylex.props(lineChartPlotStyles.band, lineChartFill[tone])}
          />
        ))}
      {geometry.series
        .filter(({ line }) => line !== '')
        .map(({ id, isDashed, label, line, tone }) => (
          <path
            d={line}
            key={id}
            {...stylex.props(
              lineChartPlotStyles.line,
              lineChartStroke[tone],
              isDashed && lineChartPlotStyles.dashed,
            )}
          >
            <title>{label}</title>
          </path>
        ))}
      {geometry.markers.map(({ d, key, label, tone }) => (
        <path
          d={d}
          key={key}
          {...stylex.props(lineChartPlotStyles.marker, lineChartStroke[tone])}
        >
          <title>{label}</title>
        </path>
      ))}
      {geometry.series.flatMap(({ dots, id }) =>
        dots.map(({ key, ...dot }) => (
          <LineChartDot key={`${id}-${key}`} {...dot} />
        )),
      )}
    </svg>
  );
};
