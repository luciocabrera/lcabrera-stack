import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-cost.loader';

import { EVALS_COST_RUNS } from '../constants/evalsDashboard.constants';
import { EvalsPageHeader } from '../EvalsPageHeader';
import { FiguresTable } from '../FiguresTable';
import { CostCharts } from './CostCharts.component';
import { COST_COLUMNS } from './EvalsCost.constants';
import { styles } from './EvalsCost.stylex';

export const EvalsCost = () => {
  const { charts, runs, subjects, suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title='Cost and latency' trail='cost and latency' />
      <p {...stylex.props(styles.note)}>
        Over the last {EVALS_COST_RUNS} runs of each suite. The SDK reports a
        cost for each trial it ran; the computed cost multiplies each trial's
        tokens by the model price in force when its run started. The two are
        never added together. Each chart point opens its run at its costliest or
        slowest trial.
      </p>
      <CostCharts charts={charts} />
      <FiguresTable
        caption='Per suite'
        columns={COST_COLUMNS}
        rows={suites.map(({ cells, id, label }) => ({
          cells: { ...cells, name: label },
          key: id,
        }))}
      />
      <FiguresTable
        caption='Per subject'
        columns={COST_COLUMNS}
        rows={subjects.map(({ cells, href, id, label }) => ({
          cells: { ...cells, name: <Link to={href}>{label}</Link> },
          key: id,
        }))}
      />
      <FiguresTable
        caption='Per run'
        columns={COST_COLUMNS}
        rows={runs.map(({ cells, href, id, label }) => ({
          cells: { ...cells, name: <Link to={href}>{label}</Link> },
          key: id,
        }))}
      />
    </div>
  );
};
