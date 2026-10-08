import type { RunSide } from './report.types.ts';

const percent = (share: number) => `${(share * 100).toFixed(1)}%`;

export const rateText = ({
  excluded,
  rate,
}: Pick<RunSide, 'excluded' | 'rate'>) => {
  const uncounted = excluded === 0 ? '' : `, ${String(excluded)} not counted`;

  return rate.kind === 'rate'
    ? `${percent(rate.rate)} (n=${String(rate.n)}, ${percent(rate.lower)}–${percent(rate.upper)}${uncounted})`
    : `insufficient data (n=${String(rate.n)}, ${String(rate.k)} passed${uncounted})`;
};
