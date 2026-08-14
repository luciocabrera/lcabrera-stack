import { mkdir, writeFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TsConfigFileSystem } from './generate.ts';

import { renderTsConfig, writeTsConfigs } from './generate.ts';

// The default file system is the half a caller never passes, so nothing else
// would notice if it stopped being node's. Mocking the module the writer
// imports is what makes "writes to disk by default" an assertion rather than a
// claim — swap the default for a no-op and the last case here fails.
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => {}),
  writeFile: vi.fn(async () => {}),
}));

type RecordedWrite = {
  readonly contents: string;
  readonly filePath: string;
};

const createRecordingFileSystem = () => {
  const directories: string[] = [];
  const writes: RecordedWrite[] = [];

  const recordDirectory: TsConfigFileSystem['mkdir'] = async (directory) => {
    directories.push(directory);
  };

  const recordWrite: TsConfigFileSystem['writeFile'] = async (
    filePath,
    contents,
  ) => {
    writes.push({ contents, filePath });
  };

  const fileSystem: TsConfigFileSystem = {
    mkdir: recordDirectory,
    writeFile: recordWrite,
  };

  return { directories, fileSystem, writes };
};

describe('renderTsConfig', () => {
  it('renders two-space JSON with a trailing newline', () => {
    expect(renderTsConfig({ compilerOptions: { strict: true } })).toBe(
      '{\n  "compilerOptions": {\n    "strict": true\n  }\n}\n',
    );
  });
});

describe('writeTsConfigs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes each entry through the supplied file system', async () => {
    const { fileSystem, writes } = createRecordingFileSystem();

    await writeTsConfigs({
      entries: [
        { config: { include: ['src'] }, filePath: '/repo/a/tsconfig.app.json' },
        { config: { include: ['lib'] }, filePath: '/repo/b/tsconfig.app.json' },
      ],
      fileSystem,
    });

    expect(writes).toStrictEqual([
      {
        contents: renderTsConfig({ include: ['src'] }),
        filePath: '/repo/a/tsconfig.app.json',
      },
      {
        contents: renderTsConfig({ include: ['lib'] }),
        filePath: '/repo/b/tsconfig.app.json',
      },
    ]);
  });

  it("creates each entry's parent directory before writing it", async () => {
    const { directories, fileSystem } = createRecordingFileSystem();

    await writeTsConfigs({
      entries: [
        { config: {}, filePath: '/repo/nested/deep/tsconfig.node.json' },
      ],
      fileSystem,
    });

    expect(directories).toStrictEqual(['/repo/nested/deep']);
  });

  it('accepts an empty entry list without writing anything', async () => {
    const { directories, fileSystem, writes } = createRecordingFileSystem();

    await writeTsConfigs({ entries: [], fileSystem });

    expect(directories).toStrictEqual([]);
    expect(writes).toStrictEqual([]);
  });

  it('falls back to node:fs when no file system is supplied', async () => {
    await writeTsConfigs({
      entries: [{ config: { strict: true }, filePath: '/repo/tsconfig.json' }],
    });

    expect(mkdir).toHaveBeenCalledWith('/repo', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      '/repo/tsconfig.json',
      renderTsConfig({ strict: true }),
      'utf8',
    );
  });
});
