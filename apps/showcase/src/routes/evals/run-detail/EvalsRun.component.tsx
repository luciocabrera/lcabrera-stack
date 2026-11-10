import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { TableRouteView } from '@lcabrera/ui';
import { DescriptionList } from '@lcabrera/ui/components/DescriptionList';
import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import { TrendSparkline } from '@lcabrera/ui/components/TrendSparkline';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { TrialPage, TrialTableRow } from '../types/trialTableRow.types';
import type { loader } from './evals-run.loader';

import { evalsHref } from '../utils/evalsHref.util';
import { isTrialPage } from '../utils/isTrialPage.util';
import { runFacts } from '../utils/runFacts.util';
import { RUN_SPARKLINE } from './EvalsRun.constants';
import { styles } from './EvalsRun.stylex';
import { SelectedTrial } from './SelectedTrial.component';

export const EvalsRun = () => {
  const { chart, chartTotal, run, selectedTrial } =
    useLoaderData<typeof loader>();
  const fetchTrialPage = createPaginatedFetcher({
    isValid: isTrialPage,
    path: `${evalsHref({ runId: run.runId })}/trials`,
  });

  return (
    <div {...stylex.props(styles.page)}>
      <div {...stylex.props(styles.header)}>
        <PageHeader title={`${run.suite} on ${run.branch}`} />
        <DescriptionList items={runFacts(run)} layout='inline' />
        <TrendSparkline
          height={RUN_SPARKLINE.height}
          isConnected={false}
          label={`Duration of each of the ${String(chart.length)} trials`}
          points={chart}
          width={RUN_SPARKLINE.width}
        />
        {chartTotal > chart.length && (
          <Text size='sm' tone='secondary'>
            The chart shows the first {chart.length} of {chartTotal} trials.
          </Text>
        )}
        {selectedTrial !== undefined && (
          <SelectedTrial runId={run.runId} trial={selectedTrial} />
        )}
      </div>
      <div {...stylex.props(styles.table)}>
        <TableRouteView<TrialTableRow, TrialPage> fetchPage={fetchTrialPage} />
      </div>
    </div>
  );
};
