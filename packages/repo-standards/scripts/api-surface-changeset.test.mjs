import { describe, expect, it } from 'vite-plus/test';

import {
  collectBumpedPackages,
  missingChangesets,
  parseChangesetBumps,
} from './api-surface-changeset.mjs';

// A merged version bump publishes on its own (ADR-043), so the cross-check is
// what turns "did I break a consumer?" into a gate: a breaking surface change
// must carry a changeset for THAT package. The auto-bump edge case matters — a
// package bumped only because a dependency moved has no surface change and must
// not be forced to carry a hand-written changeset — so the check keys on
// "surface changed", never on version deltas. See issue #359.

describe('parseChangesetBumps', () => {
  it('reads the bumped package names from frontmatter', () => {
    const content = [
      '---',
      "'@lcabrera/server': minor",
      '"@lcabrera/api": patch',
      '---',
      '',
      'Reshape the query filter union.',
    ].join('\n');
    expect(parseChangesetBumps(content)).toEqual([
      '@lcabrera/server',
      '@lcabrera/api',
    ]);
  });

  it('returns nothing for a file without frontmatter', () => {
    expect(parseChangesetBumps('just prose, no fences')).toEqual([]);
  });

  it('ignores prose that looks like a bump outside the fences', () => {
    const content = ['---', '"@lcabrera/ui": major', '---', 'x: minor'].join(
      '\n',
    );
    expect(parseChangesetBumps(content)).toEqual(['@lcabrera/ui']);
  });
});

describe('collectBumpedPackages', () => {
  it('unions the bumps across every changeset file', () => {
    const bumped = collectBumpedPackages([
      '---\n"@lcabrera/server": minor\n---\n',
      '---\n"@lcabrera/server": patch\n"@lcabrera/utils": minor\n---\n',
    ]);
    expect([...bumped].sort((a, b) => a.localeCompare(b))).toEqual([
      '@lcabrera/server',
      '@lcabrera/utils',
    ]);
  });
});

describe('missingChangesets', () => {
  it('requires a changeset for a breaking change that has none', () => {
    const missing = missingChangesets({
      bumpedPackages: new Set(),
      changedPackages: [{ breaking: true, name: '@lcabrera/server' }],
    });
    expect(missing).toEqual([
      { breaking: true, name: '@lcabrera/server', required: true },
    ]);
  });

  it('treats an additive change without a changeset as advisory only', () => {
    const missing = missingChangesets({
      bumpedPackages: new Set(),
      changedPackages: [{ breaking: false, name: '@lcabrera/api' }],
    });
    expect(missing).toEqual([
      { breaking: false, name: '@lcabrera/api', required: false },
    ]);
  });

  it('is satisfied when the changed package is bumped', () => {
    const missing = missingChangesets({
      bumpedPackages: new Set(['@lcabrera/server']),
      changedPackages: [{ breaking: true, name: '@lcabrera/server' }],
    });
    expect(missing).toEqual([]);
  });
});
