import { NavLink } from '@lcabrera/ui/components/NavLink';
import { PageHeader } from '@lcabrera/ui/components/PageHeader';
import { Text } from '@lcabrera/ui/components/Text';
import * as stylex from '@stylexjs/stylex';
import { useLoaderData } from 'react-router';

import type { loader } from './evals-confusion.loader';

import { pageStyles } from '../evalsPage.stylex';
import { evalsHref } from '../utils/evalsHref.util';
import { ConfusionMatrix } from './ConfusionMatrix.component';
import { ConfusionRunPicker } from './ConfusionRunPicker.component';

export const EvalsConfusion = () => {
  const { choices, matrix, runs, selectedRunId } =
    useLoaderData<typeof loader>();
  const [only] = runs;
  const scope =
    selectedRunId === undefined
      ? `the last ${String(runs.length)} skills runs`
      : `the run of ${only?.label ?? selectedRunId}`;

  return (
    <div {...stylex.props(pageStyles.page)}>
      <PageHeader title='Trigger confusion' />
      <Text size='sm' tone='secondary'>
        One row per expectation: a trigger task expects its skill to load, a
        near-miss task (<em>not</em> the skill) expects it to stay unloaded. One
        column per skill any trial loaded. A trial that loaded two skills counts
        in both columns, one that loaded none counts under (none), and one whose
        session failed under (error). A count in red is a skill loading where
        the task did not expect it, or none loading where one was expected.
        Skipped trials are left out.
      </Text>
      <ConfusionRunPicker choices={choices} selectedRunId={selectedRunId} />
      {selectedRunId !== undefined && (
        <Text size='sm' tone='secondary'>
          <NavLink to={evalsHref({ runId: selectedRunId })} variant='inline'>
            Open the run
          </NavLink>
        </Text>
      )}
      {matrix.rows.length === 0 ? (
        <Text>No trigger or near-miss trial is stored for {scope}.</Text>
      ) : (
        <ConfusionMatrix matrix={matrix} scope={scope} />
      )}
    </div>
  );
};
