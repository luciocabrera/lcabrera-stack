import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-flaky.loader';

import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { pageStyles } from '../evalsPage.stylex';
import { EvalsPageHeader } from '../EvalsPageHeader';
import { FiguresTable } from '../FiguresTable';
import { styles } from './EvalsFlaky.stylex';

export const EvalsFlaky = () => {
  const { suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(pageStyles.page)}>
      <EvalsPageHeader title='Flaky tasks' trail='flaky' />
      <p {...stylex.props(pageStyles.note)}>
        Per suite, the tasks the regression rule behind the banner on{' '}
        <Link to='/evals'>the overview</Link> leaves out when it judges
        main&apos;s latest run against the one before. Such a task had trials
        that disagreed in more than {EVALS_FLAKY.disagreeFraction * 100}% of its
        last {EVALS_FLAKY.window} runs, not counting those two runs, so a drop
        in the run being judged cannot make its own task flaky. A suite with
        fewer than two main runs has no pair to judge, and its list counts every
        run. Each cell is the task&apos;s passing trials out of its scored ones
        in that run.
      </p>
      {suites.length === 0 && <p>No eval runs are stored yet.</p>}
      {suites.map(({ basis, runs, suite, tasks }) => (
        <section key={suite} {...stylex.props(pageStyles.section)}>
          <h2 {...stylex.props(pageStyles.heading)}>{suite}</h2>
          <p {...stylex.props(pageStyles.note)}>
            {basis.kind === 'pair' ? (
              <>
                Left out when judging{' '}
                <Link to={basis.latest.href}>{basis.latest.label}</Link> against{' '}
                <Link to={basis.previous.href}>{basis.previous.label}</Link>.
                Neither run counts toward flakiness.
              </>
            ) : (
              'Fewer than two main runs, so there is no pair to judge and no run is left out of the count.'
            )}
          </p>
          {tasks.length === 0 ? (
            <p {...stylex.props(pageStyles.note)}>No flaky task is left out.</p>
          ) : (
            <FiguresTable
              caption={`${suite}: ${String(tasks.length)} flaky tasks left out, each over the suite's last ${String(runs.length)} runs, oldest first`}
              columns={[
                { key: 'task', label: 'Task' },
                { isNumeric: true, key: 'disagreeing', label: 'Split runs' },
                ...runs.map(({ label, runId }) => ({
                  isNumeric: true,
                  key: runId,
                  label,
                })),
              ]}
              rows={tasks.map(
                ({ cells, disagreeing, runs: judged, taskKey }) => ({
                  cells: {
                    disagreeing: `${String(disagreeing)} of ${String(judged)}`,
                    task: taskKey,
                    ...Object.fromEntries(
                      cells.map(({ href, isSplit, label, runId }) => [
                        runId,
                        <Link
                          key={runId}
                          to={href}
                          {...stylex.props(isSplit && styles.split)}
                        >
                          {label}
                        </Link>,
                      ]),
                    ),
                  },
                  key: taskKey,
                }),
              )}
            />
          )}
        </section>
      ))}
    </div>
  );
};
