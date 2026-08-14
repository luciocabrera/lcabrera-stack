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

type PlannedWrite = {
  readonly contents: string;
  readonly filePath: string;
};

type RenderArgs = {
  readonly config: unknown;
  /** Prefixed to the failure message — the entry's path, when there is one. */
  readonly subject?: string;
};

type WriteEntryArgs = {
  readonly fileSystem: TsConfigFileSystem;
  readonly write: PlannedWrite;
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
 * `JSON.stringify` signals "not representable as JSON" two different ways, and
 * only one of them is loud: a circular structure throws, but `undefined`, a
 * function and a symbol each return `undefined` instead. Interpolated, that
 * becomes the literal text `undefined` in a committed tsconfig — which surfaces
 * much later as a parse error against the generated file, naming neither the
 * entry that produced it nor the reason.
 */
const render = ({ config, subject }: RenderArgs) => {
  const json = JSON.stringify(config, undefined, 2);

  if (json === undefined) {
    const reason = `not representable as JSON (${typeof config}) — a tsconfig must be a plain object`;
    throw new TypeError(
      subject === undefined ? reason : `${subject}: ${reason}`,
    );
  }

  return `${json}\n`;
};

/**
 * A config as it is written to disk: two-space JSON with a trailing newline.
 * Throws a `TypeError` for a config JSON cannot represent.
 *
 * Exported because the exact bytes are the contract. A generated tsconfig is
 * committed, so any drift in this rendering shows up as a diff in every
 * workspace at once, and a consumer generating through its own build system
 * needs to be able to produce the identical string.
 */
export const renderTsConfig = (config: unknown) => render({ config });

const writeEntry = async ({ fileSystem, write }: WriteEntryArgs) => {
  await fileSystem.mkdir(path.dirname(write.filePath), { recursive: true });
  await fileSystem.writeFile(write.filePath, write.contents, 'utf8');
};

/**
 * Writes every entry, creating any missing parent directory first.
 *
 * Every entry is rendered before any of them is written, so a config that
 * cannot be represented as JSON fails the whole run instead of leaving a
 * half-generated tree behind — the failure names the entry's `filePath`.
 */
export const writeTsConfigs = async ({
  entries,
  fileSystem = NODE_FILE_SYSTEM,
}: WriteTsConfigsArgs) => {
  const writes = entries.map(({ config, filePath }) => ({
    contents: render({ config, subject: filePath }),
    filePath,
  }));

  await Promise.all(writes.map((write) => writeEntry({ fileSystem, write })));
};
