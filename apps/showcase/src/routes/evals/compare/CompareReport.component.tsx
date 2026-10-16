import * as stylex from '@stylexjs/stylex';
import { Link } from 'react-router';

import type { CompareReportProps } from './EvalsCompare.types';

import { FiguresTable } from '../FiguresTable';
import { evalsHref } from '../utils/evalsHref.util';
import { subjectHref } from '../utils/subjectHref.util';
import { FLIP_COLUMNS, TOTAL_COLUMNS } from './EvalsCompare.constants';
import { styles } from './EvalsCompare.stylex';
import { runChoiceLabel } from './runChoiceLabel.util';

export const CompareReport = ({
  comparison: { a, b, changes, flips, tasks, totals },
}: CompareReportProps) => (
  <>
    <p {...stylex.props(styles.note)}>
      A: <Link to={evalsHref({ runId: a.runId })}>{runChoiceLabel(a)}</Link>
      <br />
      B: <Link to={evalsHref({ runId: b.runId })}>{runChoiceLabel(b)}</Link>
    </p>
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Flipped tasks</h2>
      {flips.length === 0 ? (
        <p {...stylex.props(styles.note)}>
          None of the {tasks} tasks changed its verdict.
        </p>
      ) : (
        <FiguresTable
          caption={`${String(flips.length)} of ${String(tasks)} tasks changed verdict`}
          columns={FLIP_COLUMNS}
          rows={flips.map((flip) => ({
            cells: {
              a: flip.a,
              b: flip.b,
              change: (
                <span
                  {...stylex.props(
                    flip.change === 'regressed' && styles.regressed,
                  )}
                >
                  {flip.change}
                </span>
              ),
              subject: (
                <Link
                  to={subjectHref({
                    kind: flip.subjectKind,
                    name: flip.subjectName,
                  })}
                >
                  {flip.subjectName}
                </Link>
              ),
              task: flip.taskKey,
            },
            key: flip.id,
          }))}
        />
      )}
    </section>
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Totals</h2>
      <FiguresTable
        caption='Run A against run B'
        columns={TOTAL_COLUMNS}
        rows={totals.map((total) => ({ cells: total, key: total.metric }))}
      />
    </section>
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>Changed inputs</h2>
      <p {...stylex.props(styles.note)}>
        {changes.kind === 'none' && 'No input hash changed between the runs.'}
        {changes.kind === 'single' && `One cause: ${changes.changed}.`}
        {changes.kind === 'multiple' &&
          `${String(changes.changed.length)} inputs changed: ${changes.changed.join(', ')}.`}
      </p>
    </section>
  </>
);
