import { describe, expect, it } from 'vite-plus/test';

import {
  describeResult,
  describeVerdict,
  fixtureWasRead,
  invokedSkills,
  judgeTask,
  readPaths,
  readTask,
  scopeError,
  sessionError,
  sessionScope,
  taskPassed,
  taskVerdicts,
  trialCount,
} from './skill-triggers.mjs';

const assistant = (...content) => ({ message: { content }, type: 'assistant' });

describe('readTask', () => {
  it('reads the prompt, the expectation and an optional fixture', () => {
    expect(
      readTask(
        [
          'id: trigger',
          'name: A task',
          'set: capability',
          'source: incident',
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
      graderSkills: [],
      id: 'trigger',
      name: 'A task',
      prompt: 'Do it.',
      set: 'capability',
      shouldTrigger: true,
      source: 'incident',
    });
  });

  it('leaves should_trigger unread when there is no expected block', () => {
    expect(readTask('id: n\nname: n\ninputs:\n  prompt: p\n')).toMatchObject({
      fixture: undefined,
      set: undefined,
      shouldTrigger: undefined,
      source: undefined,
    });
    expect(
      readTask('id: n\nname: n\ninputs:\n  prompt: p\nexpected:\n'),
    ).toMatchObject({ shouldTrigger: undefined });
  });

  it('keeps a should_trigger that is not a boolean as written', () => {
    expect(
      readTask(
        'id: n\nname: n\ninputs:\n  prompt: p\nexpected:\n  should_trigger: "yes"\n',
      ),
    ).toMatchObject({ shouldTrigger: 'yes' });
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

  it('numbers the trial when there is one', () => {
    expect(
      describeResult({
        fixtureRead: true,
        invoked: [],
        passed: false,
        skill: 'epic',
        task: { id: 'trigger', shouldTrigger: true },
        trial: 2,
      }),
    ).toBe('FAIL epic/trigger #2: should load; invoked no skill');
  });
});

describe('trialCount', () => {
  it('accepts one trial and refuses fewer or a non-number', () => {
    expect(trialCount('3')).toBe(3);
    expect(trialCount('1')).toBe(1);
    expect(() => trialCount('0')).toThrow('at least 1; got "0"');
    expect(() => trialCount('three')).toThrow('got "three"');
  });
});

describe('taskVerdicts', () => {
  const trial = ({ id = 'trigger', passed, trial: number }) => ({
    error: undefined,
    fixtureRead: true,
    invoked: passed ? ['epic'] : [],
    passed,
    skill: 'epic',
    task: { id, shouldTrigger: true },
    trial: number,
  });
  const verdicts = taskVerdicts([
    trial({ passed: true, trial: 1 }),
    trial({ passed: false, trial: 2 }),
    trial({ passed: true, trial: 3 }),
    trial({ id: 'broken', passed: false, trial: 1 }),
    trial({ id: 'broken', passed: false, trial: 2 }),
    trial({ id: 'stable', passed: true, trial: 1 }),
  ]);

  it('tells a task that sometimes passes from one that never does', () => {
    expect(
      verdicts.map(({ name, passed, trials, verdict }) => ({
        name,
        passed,
        trials,
        verdict,
      })),
    ).toStrictEqual([
      { name: 'epic/trigger', passed: 2, trials: 3, verdict: 'flaky' },
      { name: 'epic/broken', passed: 0, trials: 2, verdict: 'fail' },
      { name: 'epic/stable', passed: 1, trials: 1, verdict: 'ok' },
    ]);
  });

  it('lists only the failed trials under a task', () => {
    expect(describeVerdict(verdicts[0])).toBe(
      [
        'FLAKY epic/trigger: 2/3 trial(s) passed',
        '      FAIL epic/trigger #2: should load; invoked no skill',
      ].join('\n'),
    );
    expect(describeVerdict(verdicts[2])).toBe(
      'ok    epic/stable: 1/1 trial(s) passed',
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

describe('scopeError', () => {
  const init = (tools) => [{ subtype: 'init', tools, type: 'system' }];

  it('accepts a session that holds exactly the requested tools', () => {
    expect(
      scopeError({
        expectedTools: ['Read', 'Skill'],
        messages: init(['Skill', 'Read']),
      }),
    ).toBeUndefined();
  });

  it('names the tools when an option was ignored and the session holds more', () => {
    expect(
      scopeError({
        expectedTools: ['Skill'],
        messages: init(['Bash', 'Skill', 'Write']),
      }),
    ).toBe('the session held Bash, Skill, Write, not Skill');
  });

  it('fails a session that never reported its tools', () => {
    expect(scopeError({ expectedTools: ['Skill'], messages: [] })).toBe(
      'the session reported no tools',
    );
  });
});
