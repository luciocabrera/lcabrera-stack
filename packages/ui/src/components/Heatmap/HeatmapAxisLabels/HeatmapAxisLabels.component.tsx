import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { HeatmapAxisLabelsProps } from './HeatmapAxisLabels.types';

import { heatmapAxisLabelStyles } from './HeatmapAxisLabels.stylex';

export const HeatmapAxisLabels = ({
  axis,
  cellSize,
  items,
}: HeatmapAxisLabelsProps) => (
  <ul
    {...stylex.props(
      heatmapAxisLabelStyles.list,
      heatmapAxisLabelStyles[axis](`${String(cellSize)}px`),
    )}
  >
    {items.map(({ key, label, to }) => (
      <li
        key={key}
        title={label}
        {...stylex.props(
          heatmapAxisLabelStyles.item,
          axis === 'column' && heatmapAxisLabelStyles.columnItem,
        )}
      >
        {to === undefined ? (
          label
        ) : (
          <Link to={to} {...stylex.props(heatmapAxisLabelStyles.link)}>
            {label}
          </Link>
        )}
      </li>
    ))}
  </ul>
);
