import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-overview.loader';

import { Sparkline } from '../Sparkline';
import { costLabel } from '../utils/costLabel.util';
import { durationLabel } from '../utils/durationLabel.util';
import { evalsHref } from '../utils/evalsHref.util';
import { intervalLabel } from '../utils/intervalLabel.util';
import { passRateLabel } from '../utils/passRateLabel.util';
import { styles } from './EvalsOverview.stylex';

export const EvalsOverview = () => {
  const { regressions, suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <h1 {...stylex.props(styles.title)}>Evals</h1>
      {regressions.map(({ latest, previous, suite }) => (
        <p key={suite} role='alert' {...stylex.props(styles.banner)}>
          {suite} regressed on main: {passRateLabel(latest)} in{' '}
          <Link to={evalsHref({ runId: latest.runId })}>the latest run</Link>,
          below the {intervalLabel(previous)} of{' '}
          <Link to={evalsHref({ runId: previous.runId })}>the run before</Link>.
        </p>
      ))}
      {suites.length === 0 && <p>No eval runs are stored yet.</p>}
      <div {...stylex.props(styles.grid)}>
        {suites.map(({ latest, points, suite }) => (
          <section key={suite} {...stylex.props(styles.card)}>
            <h2 {...stylex.props(styles.suiteName)}>
              <Link to={evalsHref({ runId: latest.runId })}>{suite}</Link>
            </h2>
            <dl {...stylex.props(styles.facts)}>
              <dt {...stylex.props(styles.factTerm)}>Pass rate</dt>
              <dd {...stylex.props(styles.factValue)}>
                {passRateLabel(latest)}
              </dd>
              <dt {...stylex.props(styles.factTerm)}>Interval</dt>
              <dd {...stylex.props(styles.factValue)}>
                {intervalLabel(latest)}
              </dd>
              <dt {...stylex.props(styles.factTerm)}>Cost</dt>
              <dd {...stylex.props(styles.factValue)}>
                {costLabel(latest.costUsd)}
              </dd>
              <dt {...stylex.props(styles.factTerm)}>Duration</dt>
              <dd {...stylex.props(styles.factValue)}>
                {durationLabel(latest.durationMs)}
              </dd>
              <dt {...stylex.props(styles.factTerm)}>Run</dt>
              <dd {...stylex.props(styles.factValue)}>
                {latest.startedAt.slice(0, 16).replace('T', ' ')} on{' '}
                {latest.branch} at {latest.gitSha.slice(0, 8)}
              </dd>
            </dl>
            <Sparkline
              label={`${suite} pass rate over its last ${String(points.length)} runs`}
              maxValue={1}
              points={points}
            />
          </section>
        ))}
      </div>
    </div>
  );
};
