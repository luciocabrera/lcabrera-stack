import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-heatmap.loader';

import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { layoutStyles } from '../evalsLayout.stylex';
import { HeatmapGrid } from '../HeatmapGrid';

export const EvalsHeatmap = () => {
  const { flaky, grids } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(layoutStyles.page)}>
      <PageHeader title='Heatmap' />
      <Text size='sm' tone='secondary'>
        Subjects down the side, runs across, oldest first. Green is a pass rate
        of 90% or more, amber 50% or more, red below. A hatched cell holds a
        task that is flaky: over its last {EVALS_FLAKY.window} runs, more than{' '}
        {EVALS_FLAKY.disagreeFraction * 100}% had trials that disagreed (
        {flaky.length} tasks now). Each cell opens its run at one of its trials.
      </Text>
      {grids.length === 0 && <Text>No eval runs are stored yet.</Text>}
      {grids.map((grid) => (
        <section key={grid.suite} {...stylex.props(layoutStyles.section)}>
          <Title level={2} variant='plain'>
            {grid.suite}
          </Title>
          <HeatmapGrid grid={grid} />
        </section>
      ))}
    </div>
  );
};
