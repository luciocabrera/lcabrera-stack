import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-quality.loader';

import { EVALS_SCORED } from '../constants/evalsDashboard.constants';
import { EvalsPageHeader } from '../EvalsPageHeader';
import { FiguresTable } from '../FiguresTable';
import { Sparkline } from '../Sparkline';
import { subjectHref } from '../utils/subjectHref.util';
import { QUALITY_TOP_SCORE } from './EvalsQuality.constants';
import { styles } from './EvalsQuality.stylex';

const COLUMNS = [
  { key: 'dimension', label: 'Dimension' },
  { isNumeric: true, key: 'latest', label: 'Latest' },
  { isNumeric: true, key: 'band', label: 'Baseline band' },
  { key: 'trend', label: 'Over the recent runs' },
];

export const EvalsQuality = () => {
  const { runs, skills } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title='Quality dimensions' trail='quality' />
      <p {...stylex.props(styles.note)}>
        The judge&apos;s mean score per rubric dimension, from 1 to{' '}
        {QUALITY_TOP_SCORE}, in each of the last {runs.length} skill-quality
        runs, oldest first. A dimension&apos;s baseline band is its mean ±{' '}
        {EVALS_SCORED.sigma} standard deviations over the runs of the
        skill&apos;s latest quality baseline; a red point fell below it, a green
        one did not, and a grey one has no band to judge against.
      </p>
      {skills.length === 0 && <p>No skill-quality run is stored yet.</p>}
      {skills.map(({ baseline, dimensions, kind, name }) => (
        <section key={`${kind}/${name}`} {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.heading)}>
            <Link to={subjectHref({ kind, name })}>{name}</Link>
          </h2>
          <p {...stylex.props(styles.note)}>
            {baseline === undefined
              ? 'No quality baseline is recorded for this skill.'
              : `Baseline of ${String(baseline.runs)} runs on ${baseline.modelId}.`}
          </p>
          <FiguresTable
            caption={`${name}: rubric dimensions`}
            columns={COLUMNS}
            rows={dimensions.map(({ band, dimension, latest, points }) => ({
              cells: {
                band:
                  band === undefined
                    ? 'none'
                    : `${band.lower.toFixed(2)} to ${band.upper.toFixed(2)}`,
                dimension,
                latest:
                  latest === undefined ? 'not scored' : latest.value.toFixed(2),
                trend: (
                  <Sparkline
                    isConnected
                    label={`${name} ${dimension} over its last ${String(points.length)} scored runs`}
                    maxValue={QUALITY_TOP_SCORE}
                    points={points}
                  />
                ),
              },
              key: dimension,
            }))}
          />
        </section>
      ))}
    </div>
  );
};
