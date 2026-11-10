import { Card } from '@lcabrera/ui/components/Card';
import { NavLink } from '@lcabrera/ui/components/NavLink';
import { Text } from '@lcabrera/ui/components/Text';

import type { SelectedTrialProps } from './EvalsRun.types';

import { evalsHref } from '../utils/evalsHref.util';
import { trialSummaryLabel } from '../utils/trialSummaryLabel.util';

export const SelectedTrial = ({ runId, trial }: SelectedTrialProps) => (
  <section aria-label={`Trial ${trial.trialId}`}>
    <Card elevation='flat' padding='md'>
      <Text size='sm'>
        {trialSummaryLabel(trial)}{' '}
        <NavLink to={evalsHref({ runId })} variant='inline'>
          Clear
        </NavLink>
      </Text>
    </Card>
  </section>
);
