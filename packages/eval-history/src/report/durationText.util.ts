import type { RunSide } from './report.types.ts';

export const durationText = ({
  durationP50Ms,
}: Pick<RunSide, 'durationP50Ms'>) =>
  durationP50Ms === undefined
    ? 'not recorded'
    : `${(durationP50Ms / 1000).toFixed(1)} s`;
