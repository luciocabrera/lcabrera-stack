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
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: false positive, case FP-0001: a table with roving focus and arrow keys is the ARIA data grid, and grid subclasses table
      role='grid'
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
