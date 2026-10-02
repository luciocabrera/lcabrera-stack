import { describe, expect, it } from 'vite-plus/test';

import {
  chunk,
  coverageProblems,
  PROMPT_SUFFIX,
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

describe('coverageProblems', () => {
  const prompt = `Do it. ${PROMPT_SUFFIX}`;
  const graded = (name, extra = {}) => [
    { graderSkills: [name], id: 'trigger', prompt, ...extra },
    { graderSkills: [name], id: 'near-miss', prompt, ...extra },
  ];
  const declaredAs = (...names) => new Map(names.map((name) => [name, name]));

  it('passes a skill with both tasks, and a scoped skill whose tasks name a fixture', () => {
    expect(
      coverageProblems({
        catalog: [
          { name: 'a', scoped: false },
          { name: 'b', scoped: true },
        ],
        declared: declaredAs('a', 'b'),
        evals: new Map([
          ['a', graded('a')],
          ['b', graded('b', { fixture: 'f' })],
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
        declared: declaredAs('b', 'c'),
        evals: new Map([
          ['b', [{ graderSkills: ['b'], id: 'trigger', prompt }]],
          [
            'c',
            [
              { fixture: 'f', graderSkills: ['c'], id: 'trigger', prompt },
              { graderSkills: ['c'], id: 'near-miss', prompt },
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      'a has no eval under evals/skills/',
      'b has no near-miss task',
      'c/near-miss names no fixture, but c has a paths: list, so it is offered only after a matching file is read',
    ]);
  });

  it('names an eval whose skill is gone', () => {
    expect(
      coverageProblems({
        catalog: [],
        declared: declaredAs('renamed-away'),
        evals: new Map([['renamed-away', graded('renamed-away')]]),
      }),
    ).toStrictEqual([
      'evals/skills/renamed-away has no skill under .github/skills/',
    ]);
  });

  it('names a copied eval that still grades the skill it was copied from', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'foo', scoped: false }],
        declared: new Map([['foo', 'releasing']]),
        evals: new Map([
          [
            'foo',
            [
              { graderSkills: ['releasing'], id: 'trigger', prompt },
              { graderSkills: [], id: 'near-miss', prompt },
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      'evals/skills/foo/eval.yaml names skill "releasing", not "foo"',
      'foo/trigger grades "releasing", not "foo"',
      'foo/near-miss has no grader naming a skill',
    ]);
  });

  it('names a task whose prompt dropped the sentence that lets it load a skill', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'a', scoped: false }],
        declared: declaredAs('a'),
        evals: new Map([
          [
            'a',
            [
              {
                graderSkills: ['a'],
                id: 'trigger',
                prompt: 'Do it. Do not run anything.',
              },
              { graderSkills: ['a'], id: 'near-miss', prompt },
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      `a/trigger does not end its prompt with "${PROMPT_SUFFIX}"`,
    ]);
  });
});
