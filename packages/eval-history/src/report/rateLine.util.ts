import type { RunSide, SidePair, Thresholds } from './report.types.ts';

import { rateText } from './rateText.util.ts';

export const rateLine = ({
  a,
  b,
  thresholds,
}: SidePair<Pick<RunSide, 'excluded' | 'rate'>> & {
  readonly thresholds: Thresholds;
}) => {
  const line = `Pass rate, Wilson interval at z=${String(thresholds.z)}: ${rateText(a)} → ${rateText(b)}.`;
  const isShort =
    a.rate.kind === 'insufficient' || b.rate.kind === 'insufficient';

  return isShort
    ? `${line} A rate needs ${String(thresholds.minTrialsForRate)} counted trials; error, timeout and skipped trials are not counted.`
    : line;
};
