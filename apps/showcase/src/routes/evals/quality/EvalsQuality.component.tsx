import type { TableColumn } from '@lcabrera/ui/components/Table';

import {
  NavLink,
  PageHeader,
  Table,
  Text,
  Title,
  TrendSparkline,
} from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-quality.loader';
import type { QualityDimensionRow } from './EvalsQuality.types';

import { EVALS_SCORED } from '../constants/evalsDashboard.constants';
import { pageStyles } from '../evalsPage.stylex';
import { subjectHref } from '../utils/subjectHref.util';
import { QUALITY_SPARKLINE, QUALITY_TOP_SCORE } from './EvalsQuality.constants';

const COLUMNS: readonly TableColumn<QualityDimensionRow>[] = [
  { key: 'dimension', label: 'Dimension' },
  {
    align: 'end',
    key: 'latest',
    label: 'Latest',
    render: ({ latest }) =>
      latest === undefined ? 'not scored' : latest.value.toFixed(2),
  },
  {
    align: 'end',
    key: 'band',
    label: 'Baseline band',
    render: ({ band }) =>
      band === undefined
        ? 'none'
        : `${band.lower.toFixed(2)} to ${band.upper.toFixed(2)}`,
  },
  {
    key: 'points',
    label: 'Over the recent runs',
    render: ({ dimension, points, skill }) => (
      <TrendSparkline
        height={QUALITY_SPARKLINE.height}
        isConnected
        label={`${skill} ${dimension} over its last ${String(points.length)} scored runs`}
        max={QUALITY_TOP_SCORE}
        points={points}
        width={QUALITY_SPARKLINE.width}
      />
    ),
  },
];

export const EvalsQuality = () => {
  const { runs, skills } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(pageStyles.page)}>
      <PageHeader title='Quality dimensions' />
      <Text size='sm' tone='secondary'>
        The judge&apos;s mean score per rubric dimension, from 1 to{' '}
        {QUALITY_TOP_SCORE}, in each of the last {runs.length} skill-quality
        runs, oldest first. A dimension&apos;s baseline band is its mean ±{' '}
        {EVALS_SCORED.sigma} standard deviations over the runs of the
        skill&apos;s latest quality baseline; a red point fell below it, a green
        one did not, and a grey one has no band to judge against.
      </Text>
      {skills.length === 0 && <Text>No skill-quality run is stored yet.</Text>}
      {skills.map(({ baseline, dimensions, kind, name }) => (
        <section key={`${kind}/${name}`} {...stylex.props(pageStyles.section)}>
          <Title level={2} variant='plain'>
            <NavLink to={subjectHref({ kind, name })} variant='inline'>
              {name}
            </NavLink>
          </Title>
          <Text size='sm' tone='secondary'>
            {baseline === undefined
              ? 'No quality baseline is recorded for this skill.'
              : `Baseline of ${String(baseline.runs)} runs on ${baseline.modelId}.`}
          </Text>
          <Table
            caption={`${name}: rubric dimensions`}
            columns={COLUMNS}
            density='spacious'
            layout='static'
            response={dimensions.map((row) => ({ ...row, skill: name }))}
          />
        </section>
      ))}
    </div>
  );
};
