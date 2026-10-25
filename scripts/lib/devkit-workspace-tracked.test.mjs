/*
 * What the created-tree gates report for a committed file a task rewrote.
 */

import { describe, expect, it } from 'vite-plus/test';

import { diffHead, modifiedTrackedFiles } from './devkit-workspace-tracked.mjs';

describe('modifiedTrackedFiles', () => {
  const diffOf = (path) =>
    `diff --git a/${path} b/${path}\n-old ${path}\n+new ${path}\n`;

  it('reports nothing for a clean tree', () => {
    expect(modifiedTrackedFiles({ diffOf, porcelain: '' })).toEqual([]);
  });

  it('names each committed file a step changed', () => {
    const findings = modifiedTrackedFiles({
      diffOf,
      porcelain: ' M vite.config.ts\n M apps/web/src/root.tsx\n',
    });
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain(
      '`vite.config.ts` changed while the gate ran',
    );
    expect(findings[1]).toContain('`apps/web/src/root.tsx`');
  });

  it('carries the diff of the file it names', () => {
    const [finding] = modifiedTrackedFiles({
      diffOf,
      porcelain: 'M  pnpm-workspace.yaml\n',
    });
    expect(finding).toContain(
      '-old pnpm-workspace.yaml\n+new pnpm-workspace.yaml',
    );
  });
});

describe('diffHead', () => {
  it('keeps a short diff whole', () => {
    expect(diffHead('-a\n+b\n')).toBe('-a\n+b');
  });

  it('keeps the head of a long diff and counts the rest', () => {
    const diff = Array.from({ length: 100 }, (_, index) => `+${index}`).join(
      '\n',
    );
    const head = diffHead(diff).split('\n');
    expect(head[0]).toBe('+0');
    expect(head).not.toContain('+99');
    expect(head.at(-1)).toBe('… 20 more line(s)');
  });

  it('says so when there is no diff', () => {
    expect(diffHead('')).toBe('no diff');
  });
});
