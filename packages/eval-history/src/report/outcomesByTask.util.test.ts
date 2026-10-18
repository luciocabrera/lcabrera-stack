import { describe, expect, it } from 'vite-plus/test';

import { outcomesByTask } from './outcomesByTask.util.ts';
import { reportTaskFixture } from './reportRunFixture.util.ts';

describe('outcomesByTask', () => {
  it('maps each task key to its outcomes', () => {
    expect(
      outcomesByTask({
        tasks: [
          reportTaskFixture({ outcomes: ['pass'], taskKey: 'a' }),
          reportTaskFixture({ outcomes: ['fail', 'pass'], taskKey: 'b' }),
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
