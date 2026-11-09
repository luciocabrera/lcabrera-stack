import * as stylex from '@stylexjs/stylex';

import { HeatmapCellMark } from '#ui/components/Heatmap/HeatmapCellMark/HeatmapCellMark.component';
import { HeatmapPatternDefs } from '#ui/components/Heatmap/HeatmapPatternDefs/HeatmapPatternDefs.component';

import type { HeatmapPlotProps } from './HeatmapPlot.types';

import { heatmapPlotStyles } from './HeatmapPlot.stylex';

export const HeatmapPlot = ({
  description,
  descriptionId,
  height,
  isGrid,
  patternIds,
  patterns,
  rows,
  size,
  title,
  titleId,
  width,
}: HeatmapPlotProps) => (
  <svg
    aria-describedby={isGrid ? undefined : descriptionId}
    aria-hidden={isGrid}
    aria-labelledby={isGrid ? undefined : titleId}
    height={height}
    role={isGrid ? undefined : 'img'}
    viewBox={`0 0 ${String(width)} ${String(height)}`}
    width={width}
    {...stylex.props(heatmapPlotStyles.svg)}
  >
    <title id={titleId}>{title}</title>
    {description !== undefined && <desc id={descriptionId}>{description}</desc>}
    <HeatmapPatternDefs patternIds={patternIds} patterns={patterns} />
    <g>
      {rows
        .flatMap(({ cells }) => cells)
        .map((cell) => (
          <HeatmapCellMark
            cell={cell}
            key={cell.key}
            name={isGrid ? undefined : cell.label}
            patternIds={patternIds}
            size={size}
          />
        ))}
    </g>
  </svg>
);
