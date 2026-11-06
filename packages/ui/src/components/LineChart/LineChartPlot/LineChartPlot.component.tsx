import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';
import {
  lineChartFill,
  lineChartLayout,
  lineChartStroke,
} from '#ui/components/LineChart/LineChart.stylex';
import { LineChartDot } from '#ui/components/LineChart/LineChartDot/LineChartDot.component';
import { LineChartPointLinks } from '#ui/components/LineChart/LineChartPointLinks/LineChartPointLinks.component';

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
  const clipId = useId();
  const clipPath = `url(#${clipId})`;
  const size = String(LINE_CHART.plotSize);

  return (
    <div {...stylex.props(lineChartLayout.plot(height))}>
      <svg
        aria-describedby={description === undefined ? undefined : descriptionId}
        aria-labelledby={titleId}
        preserveAspectRatio='none'
        role='img'
        viewBox={`0 0 ${size} ${size}`}
        {...stylex.props(lineChartLayout.svg)}
      >
        <title id={titleId}>{title}</title>
        {description !== undefined && (
          <desc id={descriptionId}>{description}</desc>
        )}
        <clipPath id={clipId}>
          <rect
            height={LINE_CHART.clipSize}
            width={LINE_CHART.clipSize}
            x={LINE_CHART.clipOrigin}
            y={LINE_CHART.clipOrigin}
          />
        </clipPath>
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
              clipPath={clipPath}
              d={band}
              key={id}
              {...stylex.props(lineChartPlotStyles.band, lineChartFill[tone])}
            />
          ))}
        {geometry.series
          .filter(({ line }) => line !== '')
          .map(({ id, isDashed, label, line, tone }) => (
            <path
              clipPath={clipPath}
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
          dots
            .filter(({ to }) => to === undefined)
            .map(({ d, key, label, tone }) => (
              <LineChartDot
                d={d}
                key={`${id}-${key}`}
                label={label}
                tone={tone}
              />
            )),
        )}
      </svg>
      <LineChartPointLinks series={geometry.series} />
    </div>
  );
};
