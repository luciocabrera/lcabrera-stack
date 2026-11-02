import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { LineChartMarkerLabelsProps } from './LineChartMarkerLabels.types';

import { lineChartMarkerLabelsStyles } from './LineChartMarkerLabels.stylex';

export const LineChartMarkerLabels = ({
  markers,
}: LineChartMarkerLabelsProps) => {
  if (markers.length === 0) return;

  return (
    <ul {...stylex.props(lineChartMarkerLabelsStyles.list)}>
      {markers.map(({ at, key, label, to }) => (
        <li
          key={key}
          {...stylex.props(lineChartMarkerLabelsStyles.item(`${String(at)}%`))}
        >
          {to === undefined ? (
            label
          ) : (
            <Link to={to} {...stylex.props(lineChartMarkerLabelsStyles.link)}>
              {label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
};
