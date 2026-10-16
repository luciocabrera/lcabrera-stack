import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-subject-trend.loader';

import { EvalsPageHeader } from '../EvalsPageHeader';
import { TrendChart } from '../TrendChart';
import { styles } from './EvalsSubjectTrend.stylex';

export const EvalsSubjectTrend = () => {
  const { kind, marks, name, points, runs } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title={`${kind} ${name}`} trail={`${kind} trend`} />
      <p {...stylex.props(styles.note)}>
        Pass rate over its last {points.length} scored runs of {runs}, with the
        Wilson interval as a band. Dashed lines mark a content-hash change, a
        model change or an annotation. Each point opens that run at one of its
        trials, a failing one where there is one.
      </p>
      <TrendChart
        label={`${kind} ${name} pass rate over time`}
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
    </div>
  );
};
