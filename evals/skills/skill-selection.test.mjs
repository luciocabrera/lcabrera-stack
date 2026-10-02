import { describe, expect, it } from 'vite-plus/test';

import {
  chunk,
  coverageProblems,
  isPathScoped,
  selectedSkills,
  selectionProblems,
  withoutSeparator,
} from './skill-triggers.mjs';

describe('selectionProblems', () => {
  it('names a skill with no eval and a hidden name in no catalog', () => {
    expect(
      selectionProblems({
        catalog: ['react-19'],
        evals: ['react-19'],
        hidden: ['react19'],
        requested: ['react-19', 'reakt-19'],
      }),
    ).toStrictEqual([
      'no eval for "reakt-19" under evals/skills/',
      '--hide "react19" names no skill in .github/skills/',
    ]);
  });

  it('finds nothing wrong with an empty selection', () => {
    expect(
      selectionProblems({ catalog: [], evals: [], hidden: [], requested: [] }),
    ).toStrictEqual([]);
  });
});

describe('chunk', () => {
  it('splits into batches of at most the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toStrictEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toStrictEqual([]);
  });
});

describe('selectedSkills', () => {
  it('selects every eval when none is named, and refuses an unknown name', () => {
    const args = { catalog: ['a'], evals: ['a', 'b'], hidden: [] };
    expect(selectedSkills({ ...args, requested: [] })).toStrictEqual([
      'a',
      'b',
    ]);
    expect(selectedSkills({ ...args, requested: ['b'] })).toStrictEqual(['b']);
    expect(() => selectedSkills({ ...args, requested: ['c'] })).toThrow(
      'no eval for "c"',
    );
  });
});

describe('isPathScoped', () => {
  it('reads a paths: key in the frontmatter only', () => {
    expect(isPathScoped("---\nname: a\npaths: ['**/*.tsx']\n---\nbody")).toBe(
      true,
    );
    expect(isPathScoped('---\nname: a\n---\npaths: in the body\n')).toBe(false);
  });
});

describe('coverageProblems', () => {
  const both = [{ id: 'trigger' }, { id: 'near-miss' }];

  it('passes a skill with both tasks, and a scoped skill whose tasks name a fixture', () => {
    expect(
      coverageProblems({
        catalog: [
          { name: 'a', scoped: false },
          { name: 'b', scoped: true },
        ],
        evals: new Map([
          ['a', both],
          ['b', both.map((task) => ({ ...task, fixture: 'f' }))],
        ]),
      }),
    ).toStrictEqual([]);
  });

  it('names a missing eval, a missing task, and a scoped task with no fixture', () => {
    expect(
      coverageProblems({
        catalog: [
          { name: 'a', scoped: false },
          { name: 'b', scoped: false },
          { name: 'c', scoped: true },
        ],
        evals: new Map([
          ['b', [{ id: 'trigger' }]],
          ['c', [{ fixture: 'f', id: 'trigger' }, { id: 'near-miss' }]],
        ]),
      }),
    ).toStrictEqual([
      'a has no eval under evals/skills/',
      'b has no near-miss task',
      'c/near-miss names no fixture, but c has a paths: list, so it is offered only after a matching file is read',
    ]);
  });
});

describe('withoutSeparator', () => {
  it('drops the -- that vp run passes through, and nothing else', () => {
    expect(withoutSeparator(['--', '--check'])).toStrictEqual(['--check']);
    expect(withoutSeparator(['epic', '--hide', 'epic'])).toStrictEqual([
      'epic',
      '--hide',
      'epic',
    ]);
  });
});

describe('coverageProblems, the other direction', () => {
  it('names an eval whose skill is gone', () => {
    expect(
      coverageProblems({
        catalog: [],
        evals: new Map([
          ['renamed-away', [{ id: 'trigger' }, { id: 'near-miss' }]],
        ]),
      }),
    ).toStrictEqual([
      'evals/skills/renamed-away has no skill under .github/skills/',
    ]);
  });
});
