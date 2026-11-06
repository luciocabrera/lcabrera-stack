import * as stylex from '@stylexjs/stylex';

import { getFillStyle } from '#ui/components/Heatmap/utils/getFillStyle.util';

import type { HeatmapCellMarkProps } from './HeatmapCellMark.types';

import { heatmapCellMarkStyles } from './HeatmapCellMark.stylex';

export const HeatmapCellMark = ({
  cell: { fill, pattern, x, y },
  name,
  patternIds,
  size,
}: HeatmapCellMarkProps) => {
  const box = { height: size, width: size, x, y };

  return (
    <>
      <rect {...box} {...stylex.props(getFillStyle(fill))}>
        {name !== undefined && <title>{name}</title>}
      </rect>
      {pattern !== undefined && (
        <rect
          {...box}
          fill={`url(#${patternIds[pattern]})`}
          {...stylex.props(heatmapCellMarkStyles.pattern)}
        />
      )}
    </>
  );
};
