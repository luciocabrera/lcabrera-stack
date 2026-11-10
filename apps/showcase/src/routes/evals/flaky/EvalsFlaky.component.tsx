import { NavLink, PageHeader, Table, Text, Title } from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-flaky.loader';
import type { FlakyTaskRow } from './EvalsFlaky.types';

import { EVALS_FLAKY } from '../constants/evalsDashboard.constants';
import { layoutStyles } from '../evalsLayout.stylex';
import { FLAKY_TASK_COLUMNS } from './EvalsFlaky.constants';
import { flakyRunColumn } from './flakyRunColumn.util';

export const EvalsFlaky = () => {
  const { suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(layoutStyles.page)}>
      <PageHeader title='Flaky tasks' />
      <Text size='sm' tone='secondary'>
        Per suite, the tasks the regression rule behind the banner on{' '}
        <NavLink to='/evals' variant='inline'>
          the overview
        </NavLink>{' '}
        leaves out when it judges main&apos;s latest run against the one before.
        Such a task had trials that disagreed in more than{' '}
        {EVALS_FLAKY.disagreeFraction * 100}% of its last {EVALS_FLAKY.window}{' '}
        runs, not counting those two runs, so a drop in the run being judged
        cannot make its own task flaky. A suite with fewer than two main runs
        has no pair to judge, and its list counts every run. Each cell is the
        task&apos;s passing trials out of its scored ones in that run.
      </Text>
      {suites.length === 0 && <Text>No eval runs are stored yet.</Text>}
      {suites.map(({ basis, runs, suite, tasks }) => {
        const rows: readonly FlakyTaskRow[] = tasks;

        return (
          <section key={suite} {...stylex.props(layoutStyles.section)}>
            <Title level={2} variant='plain'>
              {suite}
            </Title>
            <Text size='sm' tone='secondary'>
              {basis.kind === 'pair' ? (
                <>
                  Left out when judging{' '}
                  <NavLink to={basis.latest.href} variant='inline'>
                    {basis.latest.label}
                  </NavLink>{' '}
                  against{' '}
                  <NavLink to={basis.previous.href} variant='inline'>
                    {basis.previous.label}
                  </NavLink>
                  . Neither run counts toward flakiness.
                </>
              ) : (
                'Fewer than two main runs, so there is no pair to judge and no run is left out of the count.'
              )}
            </Text>
            {tasks.length === 0 ? (
              <Text size='sm' tone='secondary'>
                No flaky task is left out.
              </Text>
            ) : (
              <Table
                caption={`${suite}: ${String(tasks.length)} flaky tasks left out, each over the suite's last ${String(runs.length)} runs, oldest first`}
                columns={[
                  ...FLAKY_TASK_COLUMNS,
                  ...runs.map((run) => flakyRunColumn(run)),
                ]}
                density='comfortable'
                layout='static'
                response={rows}
              />
            )}
          </section>
        );
      })}
    </div>
  );
};
