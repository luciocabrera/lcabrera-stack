import { Card } from '@lcabrera/ui/components/Card';
import { DescriptionList } from '@lcabrera/ui/components/DescriptionList';
import { Table } from '@lcabrera/ui/components/Table';
import { Text } from '@lcabrera/ui/components/Text';
import { Title } from '@lcabrera/ui/components/Title';
import { TrendSparkline } from '@lcabrera/ui/components/TrendSparkline';
import * as stylex from '@stylexjs/stylex';

import type { HealthSuiteProps } from './EvalsHealth.types';

import { pageStyles } from '../evalsPage.stylex';
import { styles } from './EvalsHealth.stylex';
import { HEALTH_SPARKLINE } from './HealthSuite.constants';
import {
  HEALTH_CLASS_COLUMNS,
  HEALTH_RUN_COLUMNS,
} from './healthTableColumns.util';

export const HealthSuite = ({
  suite: { classes, points, runs, suite, totals, troubled },
}: HealthSuiteProps) => {
  const chartLabel = `${suite} errors and timeouts per run over its last ${String(runs)} runs`;

  return (
    <Card customStylex={pageStyles.section} padding='lg'>
      <Title level={2} variant='plain'>
        {suite}
      </Title>
      <DescriptionList
        items={[
          { term: 'Runs', value: runs },
          { term: 'Trials', value: totals.trials },
          { term: 'Errors', value: totals.errors },
          { term: 'Timeouts', value: totals.timeouts },
          { term: 'Rate limits', value: totals.rateLimits },
        ]}
      />
      <figure aria-label={chartLabel} {...stylex.props(styles.figure)}>
        <TrendSparkline
          height={HEALTH_SPARKLINE.height}
          label={chartLabel}
          points={points}
          width={HEALTH_SPARKLINE.width}
        />
      </figure>
      {classes.length === 0 ? (
        <Text size='sm' tone='secondary'>
          No error or timeout in its last {runs} runs.
        </Text>
      ) : (
        <>
          <Table
            caption={`${suite}: errors and timeouts by error class`}
            columns={HEALTH_CLASS_COLUMNS}
            density='compact'
            layout='static'
            response={classes}
          />
          <Table
            caption={`${suite}: the runs with an error or a timeout, newest first`}
            columns={HEALTH_RUN_COLUMNS}
            density='compact'
            layout='static'
            response={troubled}
          />
        </>
      )}
    </Card>
  );
};
