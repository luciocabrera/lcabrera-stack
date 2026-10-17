import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-heatmap.loader';

import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { EvalsPageHeader } from '../EvalsPageHeader';
import { HeatmapGrid } from '../HeatmapGrid';
import { styles } from './EvalsHeatmap.stylex';

export const EvalsHeatmap = () => {
  const { flaky, grids } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title='Heatmap' trail='heatmap' />
      <p {...stylex.props(styles.note)}>
        Subjects down the side, runs across, oldest first. Green is a pass rate
        of 90% or more, amber 50% or more, red below. A hatched cell holds a
        task that is flaky: over its last {EVALS_FLAKY.window} runs, more than{' '}
        {EVALS_FLAKY.disagreeFraction * 100}% had trials that disagreed (
        {flaky.length} tasks now). Each cell opens its run at one of its trials.
      </p>
      {grids.length === 0 && <p>No eval runs are stored yet.</p>}
      {grids.map((grid) => (
        <section key={grid.suite} {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.heading)}>{grid.suite}</h2>
          <HeatmapGrid grid={grid} />
        </section>
      ))}
    </div>
  );
};
