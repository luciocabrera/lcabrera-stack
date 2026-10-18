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
        A task is flaky when, over its last {EVALS_FLAKY.window} runs, more than{' '}
        {EVALS_FLAKY.disagreeFraction * 100}% had trials that disagreed. A flaky
        task is left out of the regression rule behind the banner on{' '}
        <Link to='/evals'>the overview</Link> until it is fixed. Each cell is
        the task&apos;s passing trials out of its scored ones in that run.
      </p>
      {suites.length === 0 && <p>No eval runs are stored yet.</p>}
      {suites.map(({ runs, suite, tasks }) => (
        <section key={suite} {...stylex.props(pageStyles.section)}>
          <h2 {...stylex.props(pageStyles.heading)}>{suite}</h2>
          {tasks.length === 0 ? (
            <p {...stylex.props(pageStyles.note)}>
              No flaky task in its last {runs.length} runs.
            </p>
          ) : (
            <FiguresTable
              caption={`${suite}: ${String(tasks.length)} flaky tasks over its last ${String(runs.length)} runs, oldest first`}
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
