import type { IngestFileSystem } from '../ingest/ingest.types.ts';

import { baselineEnvelopes } from './baselineEnvelopes.service.ts';
import { harnessProblem } from './harnessProblem.util.ts';
import { missingRunsProblem } from './missingRunsProblem.util.ts';

type CheckBaselineRunArgs = {
  readonly baselineId: string;
  readonly exclude?: readonly string[];
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
  readonly runs: number;
};

export const checkBaselineRun = async ({
  baselineId,
  exclude,
  fileSystem,
  paths,
  runs,
}: CheckBaselineRunArgs) => {
  const { envelopes, invalid } = await baselineEnvelopes({
    baselineId,
    exclude,
    fileSystem,
    paths,
  });
  const harness = envelopes
    .map(({ envelope }) => harnessProblem(envelope))
    .filter((problem) => problem !== undefined);
  const missing = missingRunsProblem({
    baselineId,
    found: envelopes.length + invalid.length,
    paths,
    runs,
  });

  return [...invalid, ...harness, ...(missing === undefined ? [] : [missing])];
};
