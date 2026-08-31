/**
 * The failure this guards is a resolver that matches nothing — a `pr:` compare
 * against the raw `'#521'`/`(none)` spellings silently resolves no file, which
 * looks exactly like "this PR had no claim" and leaves the register stale.
 *
 * Both directions are asserted, and the fail direction first: a suite that only
 * checks "the matching file is resolved" passes just as happily against an
 * implementation that returns the whole directory. The mixed-register and
 * template cases are what kill "resolve everything"; the matching cases are what
 * kill "resolve nothing".
 */
import { describe, expect, it } from 'vite-plus/test';

import { prNumberOf, tasksClosedBy } from './coordination-close.mjs';

const MERGED = { headRef: 'chore/529-coordination-auto-close', prNumber: 533 };

const task = (overrides = {}, name = 'coordination-auto-close.md') => ({
  data: {
    branch: 'chore/529-coordination-auto-close',
    id: name.replace(/\.md$/, ''),
    pr: "'#533'",
    status: 'active',
    ...overrides,
  },
  name,
  slug: name.replace(/\.md$/, ''),
});

const other = task(
  { branch: 'fix/486-tooltip-arrow-border', id: 'tooltip', pr: '(none)' },
  'tooltip-arrow-border.md',
);

const names = (entries) => entries.map((entry) => entry.name);

describe('tasksClosedBy — the fail direction', () => {
  it('resolves nothing when no task claims the merged PR or its branch', () => {
    expect(tasksClosedBy({ entries: [other], ...MERGED })).toEqual([]);
  });

  it('resolves only the claiming task, leaving every other claim alone', () => {
    expect(
      names(tasksClosedBy({ entries: [other, task()], ...MERGED })),
    ).toEqual(['coordination-auto-close.md']);
  });

  it('never resolves _TEMPLATE.md, even when its frontmatter would match', () => {
    const template = task({}, '_TEMPLATE.md');
    expect(tasksClosedBy({ entries: [template], ...MERGED })).toEqual([]);
  });

  it('resolves nothing when neither signal is real', () => {
    const entries = [task({ branch: '(worktree)', pr: '(none)' })];
    expect(
      tasksClosedBy({ entries, headRef: '(worktree)', prNumber: '(none)' }),
    ).toEqual([]);
  });

  it('ignores a file with no frontmatter instead of throwing', () => {
    const broken = { data: undefined, name: 'broken.md', slug: 'broken' };
    expect(tasksClosedBy({ entries: [broken], ...MERGED })).toEqual([]);
  });
});

describe('tasksClosedBy — the pass direction', () => {
  it.each([['#533'], ["'#533'"], ['533'], [533], [' 533 ']])(
    'resolves a task recording pr: %s',
    (pr) => {
      const entries = [task({ branch: 'some/other-branch', pr })];
      expect(names(tasksClosedBy({ entries, ...MERGED }))).toEqual([
        'coordination-auto-close.md',
      ]);
    },
  );

  it('resolves a task from a full pull-request URL in pr:', () => {
    const pr = 'https://github.com/luciocabrera/lcabrera-stack/pull/533';
    const entries = [task({ branch: 'some/other-branch', pr })];
    expect(names(tasksClosedBy({ entries, ...MERGED }))).toHaveLength(1);
  });

  it('resolves on the branch when the claim never recorded its PR', () => {
    const entries = [task({ pr: '(none)' })];
    expect(names(tasksClosedBy({ entries, ...MERGED }))).toEqual([
      'coordination-auto-close.md',
    ]);
  });

  it('resolves on the branch when pr: is absent entirely', () => {
    const entries = [task({ pr: undefined })];
    expect(
      names(
        tasksClosedBy({
          entries,
          headRef: MERGED.headRef,
          prNumber: undefined,
        }),
      ),
    ).toEqual(['coordination-auto-close.md']);
  });

  it('resolves every task that claims the same merge', () => {
    const second = task({ id: 'second' }, 'second.md');
    expect(
      names(tasksClosedBy({ entries: [task(), second], ...MERGED })),
    ).toEqual(['coordination-auto-close.md', 'second.md']);
  });
});

describe('prNumberOf', () => {
  it.each([['(none)'], [''], ['   '], ['#'], ['no-pr'], [undefined], [[]]])(
    'reads no number from %s',
    (value) => {
      expect(prNumberOf(value)).toBeUndefined();
    },
  );

  it.each([
    ['#521', 521],
    ["'#521'", 521],
    ['521', 521],
    [521, 521],
    ['https://github.com/luciocabrera/lcabrera-stack/pull/58', 58],
  ])('reads %s as %i', (value, expected) => {
    expect(prNumberOf(value)).toBe(expected);
  });
});
