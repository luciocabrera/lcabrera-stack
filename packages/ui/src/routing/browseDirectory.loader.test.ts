import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RouterContextProvider } from 'react-router';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loader } from './browseDirectory.loader';

const buildArgs = (targetPath: string) => {
  const url = `http://localhost/_action/browse-directory?path=${encodeURIComponent(targetPath)}`;
  return {
    context: new RouterContextProvider(),
    params: {},
    pattern: '/_action/browse-directory',
    request: new Request(url),
    url: new URL(url),
  };
};

describe('browseDirectory loader', () => {
  // Statically-derived fixture root (cwd is packages/ui when vitest runs):
  // security/detect-non-literal-fs-filename only accepts statically
  // resolvable paths, which a mkdtempSync result can never be.
  const root = path.join(
    process.cwd(),
    'node_modules',
    '.cache',
    'browse-directory-loader-test',
  );

  beforeAll(() => {
    rmSync(root, { force: true, recursive: true });
    mkdirSync(path.join(root, 'zeta'), { recursive: true });
    mkdirSync(path.join(root, 'alpha'));
    writeFileSync(path.join(root, 'a-file.txt'), 'not a directory');
  });

  afterAll(() => {
    rmSync(root, { force: true, recursive: true });
  });

  it('lists only real subdirectories of a real path, sorted by name', async () => {
    const result = await loader(buildArgs(root));

    expect(result.path).toBe(root);
    expect(result.error).toBeUndefined();
    expect(result.entries.map((entry) => entry.name)).toEqual([
      'alpha',
      'zeta',
    ]);
    expect(result.entries[0]?.path).toBe(path.join(root, 'alpha'));
  });

  it('computes parentPath as the real parent directory', async () => {
    const result = await loader(buildArgs(path.join(root, 'alpha')));

    expect(result.parentPath).toBe(root);
  });

  it('returns a graceful error for a path that does not exist', async () => {
    const result = await loader(buildArgs(path.join(root, 'does-not-exist')));

    expect(result.entries).toEqual([]);
    expect(result.error).toBeDefined();
  });
});
