import type { IngestFileSystem } from '../ingest/ingest.types.ts';

import { baselineEnvelopes } from './baselineEnvelopes.service.ts';
import { harnessProblem } from './harnessProblem.util.ts';

type CheckBaselineRunArgs = {
  readonly baselineId: string;
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
  readonly runs: number;
};

export const checkBaselineRun = async ({
  baselineId,
  fileSystem,
  paths,
  runs,
}: CheckBaselineRunArgs) => {
  const { envelopes, problems } = await baselineEnvelopes({
    baselineId,
    fileSystem,
    paths,
  });
  const harness = envelopes
    .map(({ envelope }) => harnessProblem(envelope))
    .filter((problem) => problem !== undefined);
  const unaccounted = runs - envelopes.length - problems.length;
  const missing =
    unaccounted > 0
      ? [
          `${String(unaccounted)} of ${String(runs)} runs left no envelope for baseline ${baselineId} under ${paths.join(', ')}, so a runner failed before recording`,
        ]
      : [];

  return [...problems, ...harness, ...missing];
};
