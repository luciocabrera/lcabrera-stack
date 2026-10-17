import { readdir, readFile, stat } from 'node:fs/promises';

import type { IngestFileSystem } from '../ingest/ingest.types.ts';

import { findEnvelopeFiles } from '../ingest/findEnvelopeFiles.service.ts';
import { readEnvelopeFile } from '../ingest/readEnvelopeFile.service.ts';

type BaselineEnvelopesArgs = {
  readonly baselineId: string;
  readonly fileSystem?: IngestFileSystem;
  readonly paths: readonly string[];
};

type MayBelongArgs = Required<
  Pick<BaselineEnvelopesArgs, 'baselineId' | 'fileSystem'>
> & {
  readonly file: string;
};

const NODE_FILE_SYSTEM: IngestFileSystem = { readdir, readFile, stat };

const mayBelong = async ({ baselineId, file, fileSystem }: MayBelongArgs) => {
  try {
    const bytes = await fileSystem.readFile(file);

    return new TextDecoder().decode(bytes).includes(baselineId);
  } catch {
    return true;
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
  const unreadable = await Promise.all(
    loaded
      .filter((entry) => !entry.ok)
      .map(async (entry) => ({
        belongs: await mayBelong({ baselineId, file: entry.file, fileSystem }),
        entry,
      })),
  );

  return {
    envelopes: loaded
      .filter((entry) => entry.ok)
      .filter(({ envelope }) => envelope.run.baseline_id === baselineId),
    problems: unreadable
      .filter(({ belongs }) => belongs)
      .map(
        ({ entry }) =>
          `${entry.file} is not a valid envelope, so it is left out: ${entry.problems.join('; ')}`,
      ),
  };
};
