import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RouterContextProvider } from 'react-router';

import { loader } from './browseDirectory.loader';

const buildArgs = (path: string) => {
  const url = `http://localhost/_action/browse-directory?path=${encodeURIComponent(path)}`;
  return {
    context: new RouterContextProvider(),
    params: {},
    pattern: '/_action/browse-directory',
    request: new Request(url),
    url: new URL(url),
  };
};

describe('browseDirectory loader', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'browse-directory-test-'));
    mkdirSync(join(root, 'zeta'));
    mkdirSync(join(root, 'alpha'));
    writeFileSync(join(root, 'a-file.txt'), 'not a directory');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('lists only real subdirectories of a real path, sorted by name', async () => {
    const result = await loader(buildArgs(root));

    expect(result.path).toBe(root);
    expect(result.error).toBeUndefined();
    expect(result.entries.map((entry) => entry.name)).toEqual([
      'alpha',
      'zeta',
    ]);
    expect(result.entries[0]?.path).toBe(join(root, 'alpha'));
  });

  it('computes parentPath as the real parent directory', async () => {
    const result = await loader(buildArgs(join(root, 'alpha')));

    expect(result.parentPath).toBe(root);
  });

  it('returns a graceful error for a path that does not exist', async () => {
    const result = await loader(buildArgs(join(root, 'does-not-exist')));

    expect(result.entries).toEqual([]);
    expect(result.error).toBeDefined();
  });
});
