import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type TsConfigEntry = {
  readonly config: unknown;
  readonly filePath: string;
};

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

const NODE_FILE_SYSTEM: TsConfigFileSystem = { mkdir, writeFile };

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

export const renderTsConfig = (config: unknown) => render({ config });

const writeEntry = async ({ fileSystem, write }: WriteEntryArgs) => {
  await fileSystem.mkdir(path.dirname(write.filePath), { recursive: true });
  await fileSystem.writeFile(write.filePath, write.contents, 'utf8');
};

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
