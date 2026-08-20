import { resolve, sep } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

import { resolveWithin } from './path-containment.mjs';

const ROOT = resolve('/tmp/containment-root');

describe('resolveWithin', () => {
  it('returns the resolved path for a file inside the root', () => {
    expect(resolveWithin(`${ROOT}${sep}a${sep}b.txt`, [ROOT])).toBe(
      `${ROOT}${sep}a${sep}b.txt`,
    );
  });

  it('accepts the root itself', () => {
    expect(resolveWithin(ROOT, [ROOT])).toBe(ROOT);
  });

  // The reason this returns a path rather than a boolean: the caller hands THIS
  // value to fs, so a traversal cannot survive by being re-derived.
  it('resolves a traversal before judging it', () => {
    expect(
      resolveWithin(`${ROOT}${sep}..${sep}escaped`, [ROOT]),
    ).toBeUndefined();
  });

  // A sibling whose name merely starts with the root's — the separator in the
  // comparison is what rejects it. Dropping `+ sep` makes this pass.
  it('refuses a sibling directory sharing the root prefix', () => {
    expect(resolveWithin(`${ROOT}-other${sep}f.txt`, [ROOT])).toBeUndefined();
  });

  it('skips roots that are absent or empty', () => {
    expect(resolveWithin(`${ROOT}${sep}f`, ['', undefined, ROOT])).toBe(
      `${ROOT}${sep}f`,
    );
    expect(resolveWithin(`${ROOT}${sep}f`, ['', undefined])).toBeUndefined();
  });

  it('accepts a path under any of several roots', () => {
    const other = resolve('/tmp/containment-other');
    expect(resolveWithin(`${other}${sep}f`, [ROOT, other])).toBe(
      `${other}${sep}f`,
    );
  });

  it('refuses when no roots are given at all', () => {
    expect(resolveWithin(`${ROOT}${sep}f`, [])).toBeUndefined();
  });
});
