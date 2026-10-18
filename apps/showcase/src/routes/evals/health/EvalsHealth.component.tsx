import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-health.loader';

import { EvalsPageHeader } from '../EvalsPageHeader';
import { FiguresTable } from '../FiguresTable';
import { Sparkline } from '../Sparkline';
import { RATE_LIMIT_CLASSES } from './EvalsHealth.constants';
import { styles } from './EvalsHealth.stylex';

const CLASS_COLUMNS = [
  { key: 'outcome', label: 'Outcome' },
  { key: 'errorClass', label: 'Error class' },
  { isNumeric: true, key: 'trials', label: 'Trials' },
  { isNumeric: true, key: 'runs', label: 'Runs' },
];

const RUN_COLUMNS = [
  { key: 'run', label: 'Run' },
  { isNumeric: true, key: 'trials', label: 'Trials' },
  { isNumeric: true, key: 'errors', label: 'Errors' },
  { isNumeric: true, key: 'timeouts', label: 'Timeouts' },
  { isNumeric: true, key: 'rateLimits', label: 'Rate limits' },
];

export const EvalsHealth = () => {
  const { suites } = useLoaderData<typeof loader>();

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title='Run health' trail='health' />
      <p {...stylex.props(styles.note)}>
        Trials that ended in an error or a timeout in the recent runs of each
        suite, counted by the error class the runner recorded. A rate limit is
        an error of class {RATE_LIMIT_CLASSES.join(' or ')}, so it counts among
        the errors too. None of these trials counts toward a pass rate.
      </p>
      {suites.length === 0 && <p>No eval runs are stored yet.</p>}
      {suites.map(({ classes, points, runs, suite, totals, troubled }) => (
        <section key={suite} {...stylex.props(styles.card)}>
          <h2 {...stylex.props(styles.heading)}>{suite}</h2>
          <dl {...stylex.props(styles.facts)}>
            <dt {...stylex.props(styles.factTerm)}>Runs</dt>
            <dd {...stylex.props(styles.factValue)}>{runs}</dd>
            <dt {...stylex.props(styles.factTerm)}>Trials</dt>
            <dd {...stylex.props(styles.factValue)}>{totals.trials}</dd>
            <dt {...stylex.props(styles.factTerm)}>Errors</dt>
            <dd {...stylex.props(styles.factValue)}>{totals.errors}</dd>
            <dt {...stylex.props(styles.factTerm)}>Timeouts</dt>
            <dd {...stylex.props(styles.factValue)}>{totals.timeouts}</dd>
            <dt {...stylex.props(styles.factTerm)}>Rate limits</dt>
            <dd {...stylex.props(styles.factValue)}>{totals.rateLimits}</dd>
          </dl>
          <Sparkline
            label={`${suite} errors and timeouts per run over its last ${String(runs)} runs`}
            points={points}
          />
          {classes.length === 0 ? (
            <p {...stylex.props(styles.note)}>
              No error or timeout in its last {runs} runs.
            </p>
          ) : (
            <>
              <FiguresTable
                caption={`${suite}: errors and timeouts by error class`}
                columns={CLASS_COLUMNS}
                rows={classes.map(
                  ({
                    errorClass,
                    id,
                    isRateLimit,
                    outcome,
                    runs: hit,
                    trials,
                  }) => ({
                    cells: {
                      errorClass: (
                        <span
                          {...stylex.props(isRateLimit && styles.rateLimit)}
                        >
                          {errorClass}
                        </span>
                      ),
                      outcome,
                      runs: hit,
                      trials,
                    },
                    key: id,
                  }),
                )}
              />
              <FiguresTable
                caption={`${suite}: the runs with an error or a timeout, newest first`}
                columns={RUN_COLUMNS}
                rows={troubled.map(
                  ({
                    errors,
                    href,
                    label,
                    rateLimits,
                    runId,
                    timeouts,
                    trials,
                  }) => ({
                    cells: {
                      errors,
                      rateLimits,
                      run: <Link to={href}>{label}</Link>,
                      timeouts,
                      trials,
                    },
                    key: runId,
                  }),
                )}
              />
            </>
          )}
        </section>
      ))}
    </div>
  );
};
