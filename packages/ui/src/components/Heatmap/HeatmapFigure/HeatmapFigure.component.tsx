import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import type { HeatmapFigureProps } from '#ui/components/Heatmap/Heatmap.types';

import { scaleByDensity } from '#ui/components/ChartSettings/utils/scaleByDensity.util';
import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';

import { heatmapLayout } from '../Heatmap.stylex';
import { HeatmapAxisLabels } from '../HeatmapAxisLabels/HeatmapAxisLabels.component';
import { HeatmapDataTable } from '../HeatmapDataTable/HeatmapDataTable.component';
import { HeatmapGrid } from '../HeatmapGrid/HeatmapGrid.component';
import { HeatmapLegend } from '../HeatmapLegend/HeatmapLegend.component';
import { HeatmapPlot } from '../HeatmapPlot/HeatmapPlot.component';
import { heatmapPlotStyles } from '../HeatmapPlot/HeatmapPlot.stylex';
import { getHeatmapGeometry } from '../utils/getHeatmapGeometry.util';
import { getUsedPatterns } from '../utils/getUsedPatterns.util';

export const HeatmapFigure = ({
  cells,
  cellSize: compactCellSize = HEATMAP.defaultCellSize,
  columns,
  description,
  hasDataTable,
  legend,
  rows,
  scale,
  settings,
  title,
}: HeatmapFigureProps) => {
  const cellSize = scaleByDensity({
    density: settings.density,
    size: compactCellSize,
  });
  const dotsId = useId();
  const hatchId = useId();
  const titleId = useId();
  const generatedDescriptionId = useId();
  const descriptionId =
    description === undefined ? undefined : generatedDescriptionId;
  const patternIds = { dots: dotsId, hatch: hatchId };
  const geometry = getHeatmapGeometry({
    cells,
    cellSize,
    columns,
    rows,
    scale,
  });
  const [firstLinked] = geometry.linked;

  return (
    <figure aria-labelledby={titleId} {...stylex.props(heatmapLayout.root)}>
      <HeatmapAxisLabels
        axis='column'
        cellSize={cellSize}
        items={columns}
        step={settings.axisLabelStep}
      />
      <HeatmapAxisLabels axis='row' cellSize={cellSize} items={rows} />
      <div {...stylex.props(heatmapPlotStyles.box)}>
        <HeatmapPlot
          description={description}
          descriptionId={descriptionId}
          height={geometry.height}
          isGrid={firstLinked !== undefined}
          patternIds={patternIds}
          patterns={getUsedPatterns({ cells, legend })}
          rows={geometry.rows}
          size={geometry.size}
          title={title}
          titleId={titleId}
          width={geometry.width}
        />
        {firstLinked !== undefined && (
          <HeatmapGrid
            descriptionId={descriptionId}
            firstLinked={firstLinked}
            linked={geometry.linked}
            rows={geometry.rows}
            titleId={titleId}
          />
        )}
      </div>
      {settings.hasLegend !== false && (
        <HeatmapLegend items={legend} patternIds={patternIds} scale={scale} />
      )}
      {(hasDataTable === true || settings.isDataTableVisible === true) && (
        <HeatmapDataTable
          columns={columns}
          isVisible={settings.isDataTableVisible === true}
          rows={geometry.rows}
          title={title}
        />
      )}
    </figure>
  );
};
