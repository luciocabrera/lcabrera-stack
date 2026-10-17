import type { BaselineRow } from './baseline.types.ts';

export const baselineHeading = ({
  baselineId,
  gitSha,
  modelId,
  suite,
}: BaselineRow) =>
  `Baseline ${baselineId}: ${suite} on ${modelId} at ${gitSha.slice(0, 12)}`;
