import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { HEATMAP } from '#ui/components/Heatmap/Heatmap.constants';
import { heatmapGridStyles } from '#ui/components/Heatmap/HeatmapGrid/HeatmapGrid.stylex';

import type { HeatmapGridRowProps } from './HeatmapGridRow.types';

export const HeatmapGridRow = ({ cells, tabStopKey }: HeatmapGridRowProps) => (
  <tr>
    {cells.map(({ key, label, to }) =>
      to === undefined ? (
        <td key={key} title={label} {...stylex.props(heatmapGridStyles.cell)} />
      ) : (
        <td key={key} {...stylex.props(heatmapGridStyles.cell)}>
          <Link
            aria-label={label}
            {...{ [HEATMAP.cellAttribute]: key }}
            tabIndex={key === tabStopKey ? 0 : -1}
            title={label}
            to={to}
            {...stylex.props(heatmapGridStyles.link)}
          />
        </td>
      ),
    )}
  </tr>
);
