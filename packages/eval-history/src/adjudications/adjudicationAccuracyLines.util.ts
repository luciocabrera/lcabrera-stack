import type { AccuracyRow } from './adjudications.types.ts';

import { formatPercent } from '../grades/formatPercent.util.ts';
import { wilson } from '../stats/wilson.util.ts';

type AdjudicationAccuracyLinesArgs = {
  readonly minN: number;
  readonly rows: readonly AccuracyRow[];
  readonly z: number;
};

const NO_TRUTH =
  'Adjudication accuracy: no true answers yet; record one with vp run evals:grade-adjudication -- <case_id> <REAL|FALSE_POSITIVE>';

export const adjudicationAccuracyLines = ({
  minN,
  rows,
  z,
}: AdjudicationAccuracyLinesArgs) =>
  rows.length === 0
    ? [NO_TRUTH]
    : rows.map(
        ({
          correct,
          falseAlarms,
          missedReal,
          model,
          verdicts,
          verifierRole,
        }) => {
          const accuracy = wilson({ k: correct, minN, n: verdicts, z });
          const verifier = `${model}, ${verifierRole}`;
          const counts = `n=${String(verdicts)} verdicts with a true answer, ${String(correct)} correct`;
          const errors = `${String(missedReal)} called FALSE_POSITIVE on a real problem, ${String(falseAlarms)} called REAL on a false positive`;

          return accuracy.kind === 'rate'
            ? `Adjudication accuracy (${verifier}): ${formatPercent(accuracy.rate)} (${counts}; Wilson interval ${formatPercent(accuracy.lower)}–${formatPercent(accuracy.upper)} at z=${String(z)}); ${errors}`
            : `Adjudication accuracy (${verifier}): insufficient data (${counts}; a rate needs ${String(minN)}); ${errors}`;
        },
      );
