import { describe, expect, it } from 'vite-plus/test';

import {
  chunk,
  describeResult,
  errorText,
  fixtureWasRead,
  invokedSkills,
  judgeTask,
  readPaths,
  readTask,
  selectedSkills,
  selectionProblems,
  sessionError,
  sessionScope,
  taskPassed,
} from './skill-triggers.mjs';

const assistant = (...content) => ({ message: { content }, type: 'assistant' });

describe('readTask', () => {
  it('reads the prompt, the expectation and an optional fixture', () => {
    expect(
      readTask(
        [
          'id: trigger',
          'name: A task',
          'inputs:',
          '  prompt: "Do it."',
          '  context:',
          '    fixture: form',
          'expected:',
          '  should_trigger: true',
        ].join('\n'),
      ),
    ).toStrictEqual({
      fixture: 'form',
      id: 'trigger',
      name: 'A task',
      prompt: 'Do it.',
      shouldTrigger: true,
    });
  });

  it('treats a missing should_trigger as a near-miss', () => {
    expect(
      readTask('id: n\nname: n\ninputs:\n  prompt: p\nexpected: {}\n'),
    ).toMatchObject({ fixture: undefined, shouldTrigger: false });
  });
});

describe('invokedSkills', () => {
  it('collects Skill tool calls and ignores every other block', () => {
    expect(
      invokedSkills([
        { subtype: 'init', type: 'system' },
        assistant(
          { text: 'loading', type: 'text' },
          {
            input: { skill: 'commit-and-pr' },
            name: 'Skill',
            type: 'tool_use',
          },
        ),
        assistant({
          input: { file_path: 'a.tsx' },
          name: 'Read',
          type: 'tool_use',
        }),
        assistant({
          input: { skill: 'unslop' },
          name: 'Skill',
          type: 'tool_use',
        }),
      ]),
    ).toStrictEqual(['commit-and-pr', 'unslop']);
  });
});

describe('judgeTask', () => {
  it('passes a trigger task only when the skill was invoked', () => {
    expect(
      judgeTask({ invoked: ['epic'], shouldTrigger: true, skill: 'epic' }),
    ).toBe(true);
    expect(
      judgeTask({ invoked: ['unslop'], shouldTrigger: true, skill: 'epic' }),
    ).toBe(false);
  });

  it('passes a near-miss only when the skill was not invoked, whatever else was', () => {
    expect(
      judgeTask({ invoked: ['unslop'], shouldTrigger: false, skill: 'epic' }),
    ).toBe(true);
    expect(
      judgeTask({ invoked: ['epic'], shouldTrigger: false, skill: 'epic' }),
    ).toBe(false);
  });
});

describe('describeResult', () => {
  it('names the session error on a task that could not finish', () => {
    expect(
      describeResult({
        error: 'Reached maximum number of turns (8)',
        fixtureRead: true,
        invoked: [],
        passed: false,
        skill: 'epic',
        task: { id: 'near-miss', shouldTrigger: false },
      }),
    ).toBe(
      'FAIL epic/near-miss: should not load; invoked no skill; error: Reached maximum number of turns (8)',
    );
  });
});

describe('sessionScope', () => {
  it('offers every skill and only the Skill tool by default', () => {
    expect(
      sessionScope({ catalog: ['a', 'b'], hidden: [], task: {} }),
    ).toStrictEqual({ skills: 'all', tools: ['Skill'] });
  });

  it('adds Read for a fixture task and leaves a hidden skill out', () => {
    expect(
      sessionScope({
        catalog: ['a', 'b'],
        hidden: ['a'],
        task: { fixture: 'f' },
      }),
    ).toStrictEqual({ skills: ['b'], tools: ['Read', 'Skill'] });
  });
});

describe('taskPassed', () => {
  it('fails a task whose session errored, even when the skills look right', () => {
    const task = { shouldTrigger: false };
    expect(
      taskPassed({
        error: undefined,
        fixtureRead: true,
        invoked: [],
        skill: 'x',
        task,
      }),
    ).toBe(true);
    expect(
      taskPassed({
        error: 'turn limit',
        fixtureRead: true,
        invoked: [],
        skill: 'x',
        task,
      }),
    ).toBe(false);
  });
});

describe('describeResult on a pass', () => {
  it('lists every skill the session invoked', () => {
    expect(
      describeResult({
        error: undefined,
        fixtureRead: true,
        invoked: ['store-pattern', 'react-19'],
        passed: true,
        skill: 'store-pattern',
        task: { id: 'trigger', shouldTrigger: true },
      }),
    ).toBe(
      'ok   store-pattern/trigger: should load; invoked store-pattern, react-19',
    );
  });
});

describe('errorText', () => {
  it('reads an Error by its message and anything else as a string', () => {
    expect(errorText(new Error('turn limit'))).toBe('turn limit');
    expect(errorText('aborted')).toBe('aborted');
  });
});

describe('fixture reads', () => {
  const read = (file_path) => ({
    message: {
      content: [{ input: { file_path }, name: 'Read', type: 'tool_use' }],
    },
    type: 'assistant',
  });

  it('collects the paths the session read', () => {
    expect(readPaths([read('/tmp/w/src/A.tsx')])).toStrictEqual([
      '/tmp/w/src/A.tsx',
    ]);
  });

  it('accepts a task with no fixture, and one whose fixture was read', () => {
    expect(fixtureWasRead({ fixtureFiles: [], read: [], task: {} })).toBe(true);
    expect(
      fixtureWasRead({
        fixtureFiles: ['src/A.tsx'],
        read: ['/tmp/w/src/A.tsx'],
        task: { fixture: 'f' },
      }),
    ).toBe(true);
  });

  it('fails a near-miss that never read its fixture, and says why', () => {
    const task = { id: 'near-miss', shouldTrigger: false };
    const fixtureRead = fixtureWasRead({
      fixtureFiles: ['src/A.tsx'],
      read: [],
      task: { fixture: 'f' },
    });
    expect(
      taskPassed({
        error: undefined,
        fixtureRead,
        invoked: [],
        skill: 'x',
        task,
      }),
    ).toBe(false);
    expect(
      describeResult({
        error: undefined,
        fixtureRead,
        invoked: [],
        passed: false,
        skill: 'x',
        task,
      }),
    ).toBe(
      'FAIL x/near-miss: should not load; invoked no skill; the session never read the fixture',
    );
  });
});

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

describe('fixtureWasRead with no files reported', () => {
  it('still requires a read when the task names a fixture', () => {
    expect(
      fixtureWasRead({ fixtureFiles: [], read: [], task: { fixture: 'f' } }),
    ).toBe(false);
  });
});

describe('sessionError', () => {
  it('accepts a session that ended in success', () => {
    expect(
      sessionError([{ subtype: 'success', type: 'result' }]),
    ).toBeUndefined();
  });

  it('reports a turn limit delivered as a result, not a throw', () => {
    expect(
      sessionError([
        { is_error: true, subtype: 'error_max_turns', type: 'result' },
      ]),
    ).toBe('the session ended with error_max_turns');
  });

  it('reports a session that never produced a result', () => {
    expect(sessionError([{ type: 'assistant' }])).toBe(
      'the session ended without a result',
    );
  });
});
