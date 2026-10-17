import type { RunSide } from './report.types.ts';

export const costText = ({
  costUsdReported,
}: Pick<RunSide, 'costUsdReported'>) =>
  costUsdReported === undefined
    ? 'not reported'
    : `$${costUsdReported.toFixed(2)} reported`;
