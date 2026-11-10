import type { SuiteSummary } from './EvalsOverview.types';

import { costLabel } from '../utils/costLabel.util';
import { durationLabel } from '../utils/durationLabel.util';
import { intervalLabel } from '../utils/intervalLabel.util';
import { passRateLabel } from '../utils/passRateLabel.util';

type SuiteFact = {
  readonly term: string;
  readonly to?: string;
  readonly value: string;
};

const flakyFact = (flakyLeftOut: SuiteSummary['flakyLeftOut']): SuiteFact =>
  flakyLeftOut === undefined
    ? { term: 'Flaky, left out', value: 'no main pair to judge' }
    : {
        term: 'Flaky, left out',
        to: '/evals/flaky',
        value: `${String(flakyLeftOut.length)} tasks`,
      };

export const suiteFacts = ({
  flakyLeftOut,
  latest,
}: SuiteSummary): readonly SuiteFact[] => [
  { term: 'Pass rate', value: passRateLabel(latest) },
  { term: 'Interval', value: intervalLabel(latest) },
  { term: 'Cost', value: costLabel(latest.costUsd) },
  { term: 'Duration', value: durationLabel(latest.durationMs) },
  flakyFact(flakyLeftOut),
  {
    term: 'Run',
    value: `${latest.startedAt.slice(0, 16).replace('T', ' ')} on ${latest.branch} at ${latest.gitSha.slice(0, 8)}`,
  },
];
