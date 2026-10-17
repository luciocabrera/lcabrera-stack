import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { SubjectTrendSeriesProps } from './EvalsSubjectTrend.types';

import { TrendChart } from '../TrendChart';
import { styles } from './EvalsSubjectTrend.stylex';

export const SubjectTrendSeries = ({
  kind,
  name,
  series: { marks, points, runs, suite },
}: SubjectTrendSeriesProps) => (
  <section {...stylex.props(styles.section)}>
    <h2 {...stylex.props(styles.heading)}>{suite}</h2>
    <p {...stylex.props(styles.note)}>
      {points.length} scored runs of the last {runs} {suite} runs that record
      this {kind}.
    </p>
    <TrendChart
      label={`${kind} ${name} pass rate in ${suite} over time`}
      marks={marks}
      points={points}
    />
    {marks.length > 0 && (
      <ul {...stylex.props(styles.list)}>
        {marks.map((mark) => (
          <li key={mark.key}>
            {mark.label}:{' '}
            <Link to={points[mark.index]?.href ?? '/evals'}>
              {points[mark.index]?.label}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </section>
);
