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

  // `JSON.stringify` RETURNS undefined for these three rather than throwing, so
  // without the guard each one interpolates to the literal text "undefined" and
  // ships as a committed tsconfig. Easy to assert, easy to forget.
  it.each([
    { config: undefined, label: 'undefined' },
    { config: () => 'nope', label: 'a function' },
    { config: Symbol('nope'), label: 'a symbol' },
  ])('throws for $label rather than emitting "undefined"', ({ config }) => {
    expect(() => renderTsConfig(config)).toThrow(TypeError);
    expect(() => renderTsConfig(config)).toThrow(/not representable as JSON/);
  });

  // The other half of the same contract, and the reason the guard tests for
  // `undefined` rather than for "anything JSON dislikes": a circular structure
  // already fails loudly on its own.
  it('lets JSON.stringify throw on its own for a circular structure', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => renderTsConfig(circular)).toThrow(/[Cc]ircular/);
  });
});

describe('writeTsConfigs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Asserted as a path → contents map rather than as an ordered array: the
  // writer dispatches through `Promise.all`, so completion order is not part of
  // the contract, and an ordered assertion would be pinning the recording
  // filesystem's synchronicity instead. The length check is what keeps a
  // duplicated path from collapsing into the map unnoticed.
  it('writes each entry through the supplied file system', async () => {
    const { fileSystem, writes } = createRecordingFileSystem();

    await writeTsConfigs({
      entries: [
        { config: { include: ['src'] }, filePath: '/repo/a/tsconfig.app.json' },
        { config: { include: ['lib'] }, filePath: '/repo/b/tsconfig.app.json' },
      ],
      fileSystem,
    });

    expect(writes).toHaveLength(2);
    expect(
      Object.fromEntries(
        writes.map(({ contents, filePath }) => [filePath, contents]),
      ),
    ).toStrictEqual({
      '/repo/a/tsconfig.app.json': renderTsConfig({ include: ['src'] }),
      '/repo/b/tsconfig.app.json': renderTsConfig({ include: ['lib'] }),
    });
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

  it('rejects naming the entry whose config cannot be represented', async () => {
    const { fileSystem } = createRecordingFileSystem();

    await expect(
      writeTsConfigs({
        entries: [{ config: undefined, filePath: '/repo/a/tsconfig.app.json' }],
        fileSystem,
      }),
    ).rejects.toThrow(/^\/repo\/a\/tsconfig\.app\.json: not representable/);
  });

  // The reason every entry is rendered before any is written: a run that fails
  // halfway leaves a tree in which some configs are new and some are stale, and
  // nothing says which.
  it('writes nothing at all when one entry cannot be represented', async () => {
    const { directories, fileSystem, writes } = createRecordingFileSystem();

    await expect(
      writeTsConfigs({
        entries: [
          { config: { strict: true }, filePath: '/repo/a/tsconfig.app.json' },
          { config: undefined, filePath: '/repo/b/tsconfig.app.json' },
        ],
        fileSystem,
      }),
    ).rejects.toThrow(TypeError);

    expect(writes).toStrictEqual([]);
    expect(directories).toStrictEqual([]);
  });
});
