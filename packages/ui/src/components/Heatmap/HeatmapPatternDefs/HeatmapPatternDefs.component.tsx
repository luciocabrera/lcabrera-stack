import * as stylex from '@stylexjs/stylex';

import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';

import type { HeatmapPatternDefsProps } from './HeatmapPatternDefs.types';

import { heatmapPatternStyles } from './HeatmapPatternDefs.stylex';

export const HeatmapPatternDefs = ({
  patternIds,
  patterns,
}: HeatmapPatternDefsProps) => {
  if (patterns.length === 0) return;

  const size = HEATMAP.patternSize;

  return (
    <defs>
      {patterns.includes('dots') && (
        <pattern
          height={size}
          id={patternIds.dots}
          patternUnits='userSpaceOnUse'
          width={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 4}
            {...stylex.props(heatmapPatternStyles.dot)}
          />
        </pattern>
      )}
      {patterns.includes('hatch') && (
        <pattern
          height={size}
          id={patternIds.hatch}
          patternTransform='rotate(45)'
          patternUnits='userSpaceOnUse'
          width={size}
        >
          <path
            d={`M0,0V${String(size)}`}
            {...stylex.props(heatmapPatternStyles.hatch)}
          />
        </pattern>
      )}
    </defs>
  );
};
