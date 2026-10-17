import type { IngestFileSystem } from '../ingest/ingest.types.ts';

import { baselineEnvelopes } from './baselineEnvelopes.service.ts';

type BaselineSoFarArgs = {
  readonly baselineId: string;
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
};

const distinct = (values: readonly string[]) => [...new Set(values)];

export const baselineSoFar = async ({
  baselineId,
  fileSystem,
  paths,
}: BaselineSoFarArgs) => {
  const { envelopes, files } = await baselineEnvelopes({
    baselineId,
    fileSystem,
    paths,
  });
  const runs = envelopes.map(({ envelope }) => envelope.run);

  return {
    files,
    gitShas: distinct(runs.map(({ git_sha }) => git_sha)),
    modelIds: distinct(
      runs
        .map(({ model_id }) => model_id)
        .filter((modelId) => modelId !== null),
    ),
  };
};
