import { describe, expect, it } from 'vite-plus/test';

import { extractCandidates, normaliseToken } from './docs-paths.mjs';

const REPO_ROOTS = ['apps', 'docs', 'packages'];

describe('normaliseToken', () => {
  it.each([
    ['packages/ui/src/x.tsx:23', 'packages/ui/src/x.tsx'],
    ['packages/ui/src/x.tsx:23-39', 'packages/ui/src/x.tsx'],
    ['packages/ui/src/x.tsx:23:7', 'packages/ui/src/x.tsx'],
    ['./Sibling.util.ts:4-9', './Sibling.util.ts'],
    ['packages/ui/src/x.tsx:23-39.', 'packages/ui/src/x.tsx'],
    ['packages/ui/src/x.tsx:23#anchor', 'packages/ui/src/x.tsx'],
  ])('strips the line suffix from %s', (token, path) => {
    expect(normaliseToken(token)).toBe(path);
  });

  it.each([
    'https://example.com/x.tsx',
    'http://localhost:3001',
    'https://example.com:8443/x.tsx',
    'localhost:3001',
    'facts.json:3',
    'mailto:someone@example.com',
    'packages/ui/src/x.tsx:abc',
    'packages/ui/src/x.tsx:1-2-3',
    'packages/ui/src/x.tsx:-4',
    'docs/a:b/c.md',
  ])('leaves %s as it was', (token) => {
    expect(normaliseToken(token)).toBe(token);
  });
});

describe('extractCandidates with a line suffix', () => {
  it('checks a suffixed path against the path alone', () => {
    expect(
      extractCandidates(
        'See `packages/ui/src/x.tsx:23-39`, [b](../gone.md:4) and `apps/y.ts:1:2`.',
        REPO_ROOTS,
      ),
    ).toEqual(['packages/ui/src/x.tsx', 'apps/y.ts', '../gone.md']);
  });

  it('still ignores a URL whose colon carries a port', () => {
    expect(
      extractCandidates(
        '[a](http://localhost:3001) and [b](localhost:3001)',
        REPO_ROOTS,
      ),
    ).toEqual([]);
  });
});
