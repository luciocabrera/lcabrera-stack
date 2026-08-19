import { describe, expect, it } from 'vite-plus/test';

import {
  branchSlug,
  globsOverlap,
  parseFrontmatter,
} from './coordination-parse.mjs';

describe('parseFrontmatter', () => {
  it('reads scalars and a list under an empty-valued key', () => {
    const source = [
      '---',
      'id: a-task',
      'area:',
      '  - packages/ui/**',
      '  - docs/**',
      'status: active',
      '---',
      '',
      'body',
    ].join('\n');
    expect(parseFrontmatter(source)).toEqual({
      area: ['packages/ui/**', 'docs/**'],
      id: 'a-task',
      status: 'active',
    });
  });

  it('is undefined when there is no frontmatter block at all', () => {
    expect(parseFrontmatter('# just a heading\n')).toBeUndefined();
  });

  it('is undefined when the block is never closed', () => {
    expect(parseFrontmatter('---\nid: a\n')).toBeUndefined();
  });

  it('ignores a line that is not a key', () => {
    expect(parseFrontmatter('---\nid: a\nnot a key line\n---\n')).toEqual({
      id: 'a',
    });
  });
});

describe('globsOverlap', () => {
  it('is true for identical and for prefix-compatible areas', () => {
    expect(globsOverlap('packages/ui/**', 'packages/ui/**')).toBe(true);
    expect(globsOverlap('packages/**', 'packages/ui/src/x.ts')).toBe(true);
  });

  it('is false for sibling areas that cannot share a path', () => {
    expect(globsOverlap('packages/ui/**', 'packages/api/**')).toBe(false);
    expect(globsOverlap('docs/a.md', 'docs/b.md')).toBe(false);
  });

  it('treats a single star as exactly one segment', () => {
    expect(globsOverlap('packages/*/src', 'packages/ui/src')).toBe(true);
    expect(globsOverlap('packages/*', 'packages/ui/src')).toBe(false);
  });

  it('lets a leading double star reach the empty path, which is why it is checked first', () => {
    expect(globsOverlap('**', 'anything/at/all.ts')).toBe(true);
    expect(globsOverlap('**', '')).toBe(true);
  });

  it('ignores a leading ./ on either side', () => {
    expect(globsOverlap('./packages/ui/**', 'packages/ui/x.ts')).toBe(true);
  });
});

describe('branchSlug', () => {
  it('reduces every run of non-word characters to a single dash', () => {
    expect(branchSlug('feat/big-thing')).toBe('feat-big-thing');
    expect(branchSlug('chore/716_a.b')).toBe('chore-716_a-b');
  });
});
