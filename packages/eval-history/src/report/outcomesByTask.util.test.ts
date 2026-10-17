import { describe, expect, it } from 'vite-plus/test';

import { outcomesByTask } from './outcomesByTask.util.ts';

describe('outcomesByTask', () => {
  it('maps each task key to its outcomes', () => {
    expect(
      outcomesByTask({
        tasks: [
          { outcomes: ['pass'], taskHash: 't1', taskKey: 'a' },
          { outcomes: ['fail', 'pass'], taskHash: 't2', taskKey: 'b' },
        ],
      }),
    ).toEqual(
      new Map([
        ['a', ['pass']],
        ['b', ['fail', 'pass']],
      ]),
    );
  });
});
