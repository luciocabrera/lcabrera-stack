import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { loader } from './evals-confusion.loader';

import { EvalsPageHeader } from '../EvalsPageHeader';
import { FiguresTable } from '../FiguresTable';
import { evalsHref } from '../utils/evalsHref.util';
import { CORNER } from './EvalsConfusion.constants';
import { styles } from './EvalsConfusion.stylex';

export const EvalsConfusion = () => {
  const { choices, matrix, runs, selectedRunId } =
    useLoaderData<typeof loader>();
  const [only] = runs;
  const scope =
    selectedRunId === undefined
      ? `the last ${String(runs.length)} skills runs`
      : `the run of ${only?.label ?? selectedRunId}`;

  return (
    <div {...stylex.props(styles.page)}>
      <EvalsPageHeader title='Trigger confusion' trail='confusion' />
      <p {...stylex.props(styles.note)}>
        One row per expectation: a trigger task expects its skill to load, a
        near-miss task (<em>not</em> the skill) expects it to stay unloaded. One
        column per skill any trial loaded. A trial that loaded two skills counts
        in both columns, one that loaded none counts under (none), and one whose
        session failed under (error). A count in red is a skill loading where
        the task did not expect it, or none loading where one was expected.
        Skipped trials are left out.
      </p>
      <nav aria-label='Runs' {...stylex.props(styles.section)}>
        <ul {...stylex.props(styles.choices)}>
          <li>
            {selectedRunId === undefined ? (
              <strong>Recent runs</strong>
            ) : (
              <Link to='/evals/confusion'>Recent runs</Link>
            )}
          </li>
          {choices.map((choice) => (
            <li key={choice.runId}>
              {choice.runId === selectedRunId ? (
                <strong>{choice.label}</strong>
              ) : (
                <Link
                  to={`/evals/confusion?${new URLSearchParams({ run: choice.runId }).toString()}`}
                >
                  {choice.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      {selectedRunId !== undefined && (
        <p {...stylex.props(styles.note)}>
          <Link to={evalsHref({ runId: selectedRunId })}>Open the run</Link>
        </p>
      )}
      {matrix.rows.length === 0 ? (
        <p>No trigger or near-miss trial is stored for {scope}.</p>
      ) : (
        <FiguresTable
          caption={`Skills loaded per expectation over ${scope}`}
          columns={[
            { key: 'expected', label: CORNER },
            ...matrix.columns.map((column) => ({
              isNumeric: true,
              key: `loaded:${column}`,
              label: column,
            })),
            { isNumeric: true, key: 'trials', label: 'Trials' },
          ]}
          rows={matrix.rows.map(({ cells, expected, trials }) => ({
            cells: {
              expected,
              trials,
              ...Object.fromEntries(
                cells.map(({ column, count, isMisload, label }) => [
                  `loaded:${column}`,
                  <span
                    key={column}
                    {...stylex.props(
                      count === 0 && styles.empty,
                      count > 0 && isMisload && styles.misload,
                    )}
                  >
                    {label}
                  </span>,
                ]),
              ),
            },
            key: expected,
          }))}
        />
      )}
    </div>
  );
};
