import { Tabs } from '@lcabrera/ui';
import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-cost.loader';

import { EVALS_COST_RUNS } from '../constants/evalsDashboard.constants';
import { layoutStyles } from '../evalsLayout.stylex';
import { CostCharts } from './CostCharts.component';
import { CostTable } from './CostTable.component';

export const EvalsCost = () => {
  const { charts, runs, subjects, suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(layoutStyles.page)}>
      <PageHeader title='Cost and latency' />
      <Text size='sm' tone='secondary'>
        Over the last {EVALS_COST_RUNS} runs of each suite. The SDK reports a
        cost for each trial it ran; the computed cost multiplies each trial's
        tokens by the model price in force when its run started. The two are
        never added together. Each chart point opens its run at its costliest or
        slowest trial.
      </Text>
      <CostCharts charts={charts} />
      <Tabs
        label='Cost tables'
        tabs={[
          {
            caption: 'Per suite',
            density: 'compact' as const,
            rows: suites.map(({ cells, label }) => ({ ...cells, name: label })),
          },
          {
            caption: 'Per subject',
            density: 'compact' as const,
            rows: subjects.map(({ cells, href, label }) => ({
              ...cells,
              href,
              name: label,
            })),
          },
          {
            caption: 'Per run',
            density: 'dense' as const,
            rows: runs.map(({ cells, href, label }) => ({
              ...cells,
              href,
              name: label,
            })),
          },
        ].map(({ caption, density, rows }) => ({
          children: (
            <CostTable caption={caption} density={density} rows={rows} />
          ),
          header: caption,
          key: caption,
        }))}
      />
    </div>
  );
};
