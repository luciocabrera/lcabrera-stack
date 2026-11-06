import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import { lineChartBackground } from '#ui/components/LineChart/LineChart.stylex';

import type {
  LineChartLinkedDot,
  LineChartPointLinksProps,
} from './LineChartPointLinks.types';

import { lineChartPointLinksStyles } from './LineChartPointLinks.stylex';

export const LineChartPointLinks = ({ series }: LineChartPointLinksProps) => {
  const links = series.flatMap(({ dots, id }) =>
    dots
      .filter((dot): dot is LineChartLinkedDot => dot.to !== undefined)
      .map((dot) => ({ ...dot, key: `${id}-${dot.key}` })),
  );

  if (links.length === 0) return;

  return (
    <ul {...stylex.props(lineChartPointLinksStyles.list)}>
      {links.map(({ key, label, left, to, tone, top }) => (
        <li
          key={key}
          {...stylex.props(
            lineChartPointLinksStyles.item(
              `${String(left)}%`,
              `${String(top)}%`,
            ),
          )}
        >
          <Link
            aria-label={label}
            title={label}
            to={to}
            {...stylex.props(
              lineChartPointLinksStyles.link,
              lineChartBackground[tone],
            )}
          />
        </li>
      ))}
    </ul>
  );
};
