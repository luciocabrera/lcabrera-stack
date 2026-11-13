import * as stylex from '@stylexjs/stylex';

import type { HeatmapAxisLabelsProps } from './HeatmapAxisLabels.types';

import { HeatmapAxisLabelText } from '../HeatmapAxisLabelText/HeatmapAxisLabelText.component';
import { heatmapAxisLabelStyles } from './HeatmapAxisLabels.stylex';

export const HeatmapAxisLabels = ({
  axis,
  cellSize,
  items,
  step = 1,
}: HeatmapAxisLabelsProps) => (
  <ul
    {...stylex.props(
      heatmapAxisLabelStyles.list,
      heatmapAxisLabelStyles[axis](`${String(cellSize)}px`),
    )}
  >
    {items.map(({ key, label, to }, index) => (
      <li
        key={key}
        title={label}
        {...stylex.props(
          heatmapAxisLabelStyles.item,
          axis === 'column' && heatmapAxisLabelStyles.columnItem,
        )}
      >
        <HeatmapAxisLabelText
          isHidden={index % step !== 0}
          label={label}
          to={to}
        />
      </li>
    ))}
  </ul>
);
