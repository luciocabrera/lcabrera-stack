import { describe, expect, it } from 'vite-plus/test';

import {
  describeResult,
  errorText,
  invokedSkills,
  judgeTask,
  readTask,
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
        invoked: [],
        passed: false,
        skill: 'epic',
        task: { id: 'near-miss', shouldTrigger: false },
      }),
    ).toBe(
      'FAIL epic/near-miss: should not load; invoked no skill; session error: Reached maximum number of turns (8)',
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
      taskPassed({ error: undefined, invoked: [], skill: 'x', task }),
    ).toBe(true);
    expect(
      taskPassed({ error: 'turn limit', invoked: [], skill: 'x', task }),
    ).toBe(false);
  });
});

describe('describeResult on a pass', () => {
  it('lists every skill the session invoked', () => {
    expect(
      describeResult({
        error: undefined,
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
