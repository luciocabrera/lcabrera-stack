import { Table } from '@lcabrera/ui/components/Table';
import { Text } from '@lcabrera/ui/components/Text';
import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';

import type { AdjudicationCasesProps } from './EvalsAdjudications.types';

import { layoutStyles } from '../evalsLayout.stylex';
import { CASE_COLUMNS } from './EvalsAdjudications.constants';

export const AdjudicationCases = ({
  cases: { rows, total },
  reopened,
}: AdjudicationCasesProps) => (
  <>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Cases
      </Title>
      <Text size='sm' tone='secondary'>
        {rows.length === total
          ? `All ${String(total)} cases, newest first.`
          : `The newest ${String(rows.length)} of ${String(total)} cases.`}{' '}
        Cost is what the three seats reported; the time is the slowest seat,
        since the three sit at once.
      </Text>
      <Table
        caption='False-positive panel cases, newest first'
        columns={CASE_COLUMNS}
        density='compact'
        layout='static'
        response={rows}
      />
    </section>
    <section {...stylex.props(layoutStyles.section)}>
      <Title level={2} variant='plain'>
        Reopened dismissals
      </Title>
      {reopened.length === 0 ? (
        <Text size='sm' tone='secondary'>
          No dismissal has been reopened.
        </Text>
      ) : (
        <ul {...stylex.props(layoutStyles.list)}>
          {reopened.map(({ caseId, label }) => (
            <li key={caseId}>
              <Text as='span' size='sm'>
                {label}
              </Text>
            </li>
          ))}
        </ul>
      )}
    </section>
  </>
);
