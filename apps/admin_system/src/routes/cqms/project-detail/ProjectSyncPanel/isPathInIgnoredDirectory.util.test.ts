import { describe, expect, it } from 'vitest';

import { isPathInIgnoredDirectory } from './isPathInIgnoredDirectory.util';

const ignoredDirectories = new Set(['.git', 'dist', 'node_modules']);

describe('isPathInIgnoredDirectory', () => {
  it('drops a path whose top segment is ignored', () => {
    expect(
      isPathInIgnoredDirectory({
        ignoredDirectories,
        relativePath: 'node_modules/react/index.js',
      }),
    ).toBe(true);
  });

  it('drops a path with an ignored segment nested anywhere', () => {
    expect(
      isPathInIgnoredDirectory({
        ignoredDirectories,
        relativePath: 'packages/ui/node_modules/x/y.js',
      }),
    ).toBe(true);
  });

  it('keeps a clean source path', () => {
    expect(
      isPathInIgnoredDirectory({
        ignoredDirectories,
        relativePath: 'src/components/Button.tsx',
      }),
    ).toBe(false);
  });

  it('matches whole segments only, not prefixes', () => {
    expect(
      isPathInIgnoredDirectory({
        ignoredDirectories,
        relativePath: 'src/node_modules_helper/index.ts',
      }),
    ).toBe(false);
  });

  it('drops a top-level ignored directory entry', () => {
    expect(
      isPathInIgnoredDirectory({
        ignoredDirectories,
        relativePath: '.git/HEAD',
      }),
    ).toBe(true);
  });
});
