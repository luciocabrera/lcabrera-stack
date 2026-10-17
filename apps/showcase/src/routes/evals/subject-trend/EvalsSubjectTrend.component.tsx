import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-subject-trend.loader';

import { EvalsPageHeader } from '../EvalsPageHeader';
import { styles } from './EvalsSubjectTrend.stylex';
import { SubjectTrendSeries } from './SubjectTrendSeries.component';

export const EvalsSubjectTrend = () => {
  const { kind, name, series } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title={`${kind} ${name}`} trail={`${kind} trend`} />
      <p {...stylex.props(styles.note)}>
        Pass rate per run, one chart for each suite that records this {kind},
        with the Wilson interval as a band. Dashed lines mark a content-hash
        change, a model change or an annotation. Each point opens that run at
        one of its trials, a failing one where there is one.
      </p>
      {series.map((entry) => (
        <SubjectTrendSeries
          key={entry.suite}
          kind={kind}
          name={name}
          series={entry}
        />
      ))}
    </div>
  );
};
