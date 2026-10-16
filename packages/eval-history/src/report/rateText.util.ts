import type { RunSide } from './report.types.ts';

import { formatPercent } from '../grades/formatPercent.util.ts';

export const rateText = ({
  excluded,
  rate,
}: Pick<RunSide, 'excluded' | 'rate'>) => {
  const uncounted = excluded === 0 ? '' : `, ${String(excluded)} not counted`;

  return rate.kind === 'rate'
    ? `${formatPercent(rate.rate)} (n=${String(rate.n)}, ${formatPercent(rate.lower)}–${formatPercent(rate.upper)}${uncounted})`
    : `insufficient data (n=${String(rate.n)}, ${String(rate.k)} passed${uncounted})`;
};
