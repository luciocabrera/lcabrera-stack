import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { TableRouteView } from '@lcabrera/ui';
import * as stylex from '@stylexjs/stylex';
import { Link, useLoaderData } from 'react-router';

import type { TrialPage, TrialTableRow } from '../types/trialTableRow.types';
import type { loader } from './evals-run.loader';

import { Sparkline } from '../Sparkline';
import { evalsHref } from '../utils/evalsHref.util';
import { isTrialPage } from '../utils/isTrialPage.util';
import { runFacts } from '../utils/runFacts.util';
import { trialSummaryLabel } from '../utils/trialSummaryLabel.util';
import { styles } from './EvalsRun.stylex';

export const EvalsRun = () => {
  const { chart, chartTotal, run, selectedTrial } =
    useLoaderData<typeof loader>();
  const fetchTrialPage = createPaginatedFetcher({
    isValid: isTrialPage,
    path: `${evalsHref({ runId: run.runId })}/trials`,
  });

  return (
    <div {...stylex.props(styles.page)}>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.note)}>
          <Link to='/evals'>Evals</Link> / run {run.runId}
        </p>
        <h1 {...stylex.props(styles.title)}>
          {run.suite} on {run.branch}
        </h1>
        <dl {...stylex.props(styles.facts)}>
          {runFacts(run).map(({ term, value }) => (
            <div key={term}>
              <dt {...stylex.props(styles.factTerm)}>{term}</dt>
              <dd {...stylex.props(styles.factValue)}>{value}</dd>
            </div>
          ))}
        </dl>
        <Sparkline
          isConnected={false}
          label={`Duration of each of the ${String(chart.length)} trials`}
          points={chart}
        />
        {chartTotal > chart.length && (
          <p {...stylex.props(styles.note)}>
            The chart shows the first {chart.length} of {chartTotal} trials.
          </p>
        )}
        {selectedTrial !== undefined && (
          <section
            aria-label={`Trial ${selectedTrial.trialId}`}
            {...stylex.props(styles.panel)}
          >
            <p {...stylex.props(styles.factValue)}>
              {trialSummaryLabel(selectedTrial)}{' '}
              <Link to={evalsHref({ runId: run.runId })}>Clear</Link>
            </p>
          </section>
        )}
      </header>
      <div {...stylex.props(styles.table)}>
        <TableRouteView<TrialTableRow, TrialPage> fetchPage={fetchTrialPage} />
      </div>
    </div>
  );
};
