import * as stylex from '@stylexjs/stylex';

import {
  HEATMAP,
  HEATMAP_DEFAULT_TONE,
} from '#ui/components/Heatmap/Heatmap.constants';
import { getFillStyle } from '#ui/components/Heatmap/utils/getFillStyle.util';
import { lineChartLegendStyles } from '#ui/components/LineChart/LineChartLegend/LineChartLegend.stylex';

import type { HeatmapLegendProps } from './HeatmapLegend.types';

import { heatmapLegendStyles } from './HeatmapLegend.stylex';

export const HeatmapLegend = ({
  items = [],
  patternIds,
  scale,
}: HeatmapLegendProps) => {
  if (items.length === 0 && scale.kind !== 'sequential') return;

  const size = HEATMAP.swatchSize;

  return (
    <ul {...stylex.props(lineChartLegendStyles.list)}>
      {scale.kind === 'sequential' && (
        <li {...stylex.props(lineChartLegendStyles.item)}>
          {scale.domain[0]}
          <span aria-hidden {...stylex.props(heatmapLegendStyles.ramp)} />
          {scale.domain[1]}
        </li>
      )}
      {items.map(({ label, pattern, tone = HEATMAP_DEFAULT_TONE }) => (
        <li key={label} {...stylex.props(lineChartLegendStyles.item)}>
          <svg aria-hidden height={size} width={size}>
            <rect
              height={size}
              width={size}
              {...stylex.props(getFillStyle({ kind: 'tone', tone }))}
            />
            {pattern !== undefined && (
              <rect
                fill={`url(#${patternIds[pattern]})`}
                height={size}
                width={size}
              />
            )}
          </svg>
          {label}
        </li>
      ))}
    </ul>
  );
};
