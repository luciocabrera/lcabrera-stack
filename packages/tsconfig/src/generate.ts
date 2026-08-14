import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** One generated config: what to write, and where to write it. */
export type TsConfigEntry = {
  readonly config: unknown;
  readonly filePath: string;
};

/**
 * The two filesystem calls the writer makes, as a seam the caller owns.
 *
 * This is not indirection for its own sake. The writer is the one part of this
 * package that touches the world, and it writes wherever its caller's entry
 * table points — so the host, not the library, is the right place for the
 * effect to be attributable. Passing an in-memory implementation is how
 * `generate.test.ts` asserts what lands on disk without a temp directory, and
 * how a consumer can dry-run a generation before committing to it.
 */
export type TsConfigFileSystem = {
  readonly mkdir: (
    directory: string,
    options: { readonly recursive: true },
  ) => Promise<unknown>;
  readonly writeFile: (
    filePath: string,
    contents: string,
    encoding: 'utf8',
  ) => Promise<unknown>;
};

type WriteEntryArgs = {
  readonly entry: TsConfigEntry;
  readonly fileSystem: TsConfigFileSystem;
};

type WriteTsConfigsArgs = {
  readonly entries: readonly TsConfigEntry[];
  readonly fileSystem?: TsConfigFileSystem;
};

/**
 * The node:fs implementation, referenced rather than wrapped: the annotation
 * then checks the seam against node's real signatures instead of against a
 * re-typed copy of them.
 */
const NODE_FILE_SYSTEM: TsConfigFileSystem = { mkdir, writeFile };

/**
 * A config as it is written to disk: two-space JSON with a trailing newline.
 *
 * Exported because the exact bytes are the contract. A generated tsconfig is
 * committed, so any drift in this rendering shows up as a diff in every
 * workspace at once, and a consumer generating through its own build system
 * needs to be able to produce the identical string.
 */
export const renderTsConfig = (config: unknown) =>
  `${JSON.stringify(config, undefined, 2)}\n`;

const writeEntry = async ({ entry, fileSystem }: WriteEntryArgs) => {
  await fileSystem.mkdir(path.dirname(entry.filePath), { recursive: true });
  await fileSystem.writeFile(
    entry.filePath,
    renderTsConfig(entry.config),
    'utf8',
  );
};

/** Writes every entry, creating any missing parent directory first. */
export const writeTsConfigs = async ({
  entries,
  fileSystem = NODE_FILE_SYSTEM,
}: WriteTsConfigsArgs) => {
  await Promise.all(entries.map((entry) => writeEntry({ entry, fileSystem })));
};
