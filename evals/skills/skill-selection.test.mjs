import { describe, expect, it } from 'vite-plus/test';

import {
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
  const task = (name, id, shouldTrigger, extra = {}) => ({
    file: `evals/skills/${name}/tasks/${id}.yaml`,
    graderSkills: [name],
    id,
    prompt,
    set: 'regression',
    shouldTrigger,
    ...extra,
  });
  const graded = (name, extra = {}) => [
    task(name, 'trigger', true, extra),
    task(name, 'near-miss', false, extra),
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
          ['b', [task('b', 'trigger', true)]],
          [
            'c',
            [
              task('c', 'trigger', true, { fixture: 'f' }),
              task('c', 'near-miss', false),
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
              task('foo', 'trigger', true, { graderSkills: ['releasing'] }),
              task('foo', 'near-miss', false, { graderSkills: [] }),
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
              task('a', 'trigger', true, {
                prompt: 'Do it. Do not run anything.',
              }),
              task('a', 'near-miss', false),
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      `a/trigger does not end its prompt with "${PROMPT_SUFFIX}"`,
    ]);
  });

  it('passes a skill with three trigger tasks and two near-miss tasks', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'a', scoped: false }],
        declared: declaredAs('a'),
        evals: new Map([
          [
            'a',
            [
              task('a', 'trigger-1', true),
              task('a', 'trigger-2', true, { set: 'capability' }),
              task('a', 'trigger-3', true, { source: 'incident' }),
              task('a', 'near-miss-1', false),
              task('a', 'near-miss-2', false, { set: 'capability' }),
            ],
          ],
        ]),
      }),
    ).toStrictEqual([]);
  });

  it('takes a task kind from should_trigger, not from its id', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'a', scoped: false }],
        declared: declaredAs('a'),
        evals: new Map([
          ['a', [task('a', 'trigger', true), task('a', 'near-miss', true)]],
        ]),
      }),
    ).toStrictEqual(['a has no near-miss task']);
  });

  it('names every file that shares an id, and a task with no id', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'a', scoped: false }],
        declared: declaredAs('a'),
        evals: new Map([
          [
            'a',
            [
              task('a', 'trigger', true),
              task('a', 'near-miss', false),
              task('a', 'trigger', true, {
                file: 'evals/skills/a/tasks/copy.yaml',
              }),
              task('a', undefined, false, {
                file: 'evals/skills/a/tasks/blank.yaml',
              }),
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      'evals/skills/a/tasks/blank.yaml has no id',
      'a has 2 tasks with id "trigger": evals/skills/a/tasks/trigger.yaml, evals/skills/a/tasks/copy.yaml',
    ]);
  });

  it('names the file of a task with no set, an unknown set, or an unknown source', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'a', scoped: false }],
        declared: declaredAs('a'),
        evals: new Map([
          [
            'a',
            [
              task('a', 'trigger', true, { set: undefined }),
              task('a', 'near-miss', false, { set: 'smoke' }),
              task('a', 'trigger-2', true, { source: 'guess' }),
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      'evals/skills/a/tasks/trigger.yaml has no set tag; give it set: regression or set: capability',
      'evals/skills/a/tasks/near-miss.yaml has set "smoke"; give it set: regression or set: capability',
      'evals/skills/a/tasks/trigger-2.yaml has source "guess"; leave it out, or give it source: incident',
    ]);
  });

  it('names the file of a task with no expected block or a should_trigger that is not a boolean', () => {
    expect(
      coverageProblems({
        catalog: [{ name: 'a', scoped: false }],
        declared: declaredAs('a'),
        evals: new Map([
          [
            'a',
            [
              ...graded('a'),
              task('a', 'blank', undefined),
              task('a', 'quoted', 'true'),
            ],
          ],
        ]),
      }),
    ).toStrictEqual([
      'evals/skills/a/tasks/blank.yaml has no expected.should_trigger; give it expected.should_trigger: true or false',
      'evals/skills/a/tasks/quoted.yaml has should_trigger "true"; give it expected.should_trigger: true or false',
    ]);
  });
});
