import { useRouteBreadcrumbs } from '@lcabrera/ui/components/Breadcrumbs';
import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-health.loader';

import { EVALS_BREADCRUMB } from '../constants/evalsDashboard.constants';
import { pageStyles } from '../evalsPage.stylex';
import { RATE_LIMIT_CLASSES } from './EvalsHealth.constants';
import { HealthSuite } from './HealthSuite.component';

export const EvalsHealth = () => {
  const { suites } = useLoaderData<typeof loader>();
  const breadcrumbs = [EVALS_BREADCRUMB, ...useRouteBreadcrumbs()];

  return (
    <div {...stylex.props(pageStyles.page)}>
      <PageHeader breadcrumbs={breadcrumbs} title='Run health' />
      <Text size='sm' tone='secondary'>
        Trials that ended in an error or a timeout in the recent runs of each
        suite, counted by the error class the runner recorded. A rate limit is
        an error of class {RATE_LIMIT_CLASSES.join(' or ')}, so it counts among
        the errors too. None of these trials counts toward a pass rate.
      </Text>
      {suites.length === 0 && <Text>No eval runs are stored yet.</Text>}
      {suites.map((suite) => (
        <HealthSuite key={suite.suite} suite={suite} />
      ))}
    </div>
  );
};
