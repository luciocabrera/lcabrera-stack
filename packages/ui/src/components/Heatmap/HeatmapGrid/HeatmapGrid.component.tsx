import * as stylex from '@stylexjs/stylex';

import { HeatmapGridRow } from '#ui/components/Heatmap/HeatmapGridRow/HeatmapGridRow.component';
import { useHeatmapRovingFocus } from '#ui/components/Heatmap/hooks/useHeatmapRovingFocus.hook';

import type { HeatmapGridProps } from './HeatmapGrid.types';

import { heatmapGridStyles } from './HeatmapGrid.stylex';

export const HeatmapGrid = ({
  descriptionId,
  firstLinked,
  linked,
  rows,
  titleId,
}: HeatmapGridProps) => {
  const { gridProps, tabStop } = useHeatmapRovingFocus({
    firstLinked,
    linked,
  });

  return (
    <table
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      {...gridProps}
      {...stylex.props(heatmapGridStyles.table)}
    >
      <tbody>
        {rows.map((row, index) => (
          <HeatmapGridRow
            cells={row.cells}
            key={row.key}
            tabStopKey={index === tabStop.rowIndex ? tabStop.key : undefined}
          />
        ))}
      </tbody>
    </table>
  );
};
