import { NavLink, Table, Text, Title } from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';

import type { CompareReportProps } from './EvalsCompare.types';

import { layoutStyles } from '../evalsLayout.stylex';
import { evalsHref } from '../utils/evalsHref.util';
import { FLIP_COLUMNS } from './CompareReport.constants';
import { TOTAL_COLUMNS } from './EvalsCompare.constants';
import { styles } from './EvalsCompare.stylex';
import { runChoiceLabel } from './runChoiceLabel.util';

export const CompareReport = ({
  comparison: { a, b, changes, flips, tasks, totals },
}: CompareReportProps) => (
  <>
    <div {...stylex.props(styles.runs)}>
      {[
        { run: a, side: 'A' },
        { run: b, side: 'B' },
      ].map(({ run, side }) => (
        <Text key={side} size='sm' tone='secondary'>
          {side}:{' '}
          <NavLink to={evalsHref({ runId: run.runId })} variant='inline'>
            {runChoiceLabel(run)}
          </NavLink>
        </Text>
      ))}
    </div>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Flipped tasks
      </Title>
      {flips.length === 0 ? (
        <Text size='sm' tone='secondary'>
          None of the {tasks} tasks changed its verdict.
        </Text>
      ) : (
        <Table
          caption={`${String(flips.length)} of ${String(tasks)} tasks changed verdict`}
          columns={FLIP_COLUMNS}
          density='comfortable'
          layout='static'
          response={flips}
        />
      )}
    </section>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Totals
      </Title>
      <Table
        caption='Run A against run B'
        columns={TOTAL_COLUMNS}
        density='comfortable'
        layout='static'
        response={totals}
      />
    </section>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Changed inputs
      </Title>
      <Text size='sm' tone='secondary'>
        {changes.kind === 'none' && 'No input hash changed between the runs.'}
        {changes.kind === 'single' && `One cause: ${changes.changed}.`}
        {changes.kind === 'multiple' &&
          `${String(changes.changed.length)} inputs changed: ${changes.changed.join(', ')}.`}
      </Text>
    </section>
  </>
);
