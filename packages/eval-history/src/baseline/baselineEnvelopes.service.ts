import { readdir, readFile, stat } from 'node:fs/promises';

import type { IngestFileSystem } from '../ingest/ingest.types.ts';

import { findEnvelopeFiles } from '../ingest/findEnvelopeFiles.service.ts';
import { readEnvelopeFile } from '../ingest/readEnvelopeFile.service.ts';

type AttributionArgs = Required<
  Pick<BaselineEnvelopesArgs, 'baselineId' | 'fileSystem'>
> & {
  readonly file: string;
};

type BaselineEnvelopesArgs = {
  readonly baselineId: string;
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
};

const NODE_FILE_SYSTEM: IngestFileSystem = { readdir, readFile, stat };

const attribution = async ({
  baselineId,
  file,
  fileSystem,
}: AttributionArgs) => {
  try {
    const bytes = await fileSystem.readFile(file);

    return new TextDecoder().decode(bytes).includes(baselineId)
      ? 'ours'
      : 'other';
  } catch {
    return 'unreadable';
  }
};

export const baselineEnvelopes = async ({
  baselineId,
  fileSystem = NODE_FILE_SYSTEM,
  paths,
}: BaselineEnvelopesArgs) => {
  const { files } = await findEnvelopeFiles({ fileSystem, paths });
  const loaded = await Promise.all(
    files.map((file) =>
      readEnvelopeFile({ file, readBytes: fileSystem.readFile }),
    ),
  );
  const failed = await Promise.all(
    loaded
      .filter((entry) => !entry.ok)
      .map(async (entry) => ({
        entry,
        owner: await attribution({ baselineId, file: entry.file, fileSystem }),
      })),
  );

  return {
    envelopes: loaded
      .filter((entry) => entry.ok)
      .filter(({ envelope }) => envelope.run.baseline_id === baselineId),
    invalid: failed
      .filter(({ owner }) => owner === 'ours')
      .map(
        ({ entry }) =>
          `${entry.file} carries baseline ${baselineId} but is not a valid envelope, so it is left out: ${entry.problems.join('; ')}`,
      ),
    unreadable: failed
      .filter(({ owner }) => owner === 'unreadable')
      .map(
        ({ entry }) =>
          `${entry.file} is left out, and no baseline can be read from it: ${entry.problems.join('; ')}`,
      ),
  };
};
