import { describe, expect, it } from 'vite-plus/test';

import { taskHashes } from './taskHashes.util.ts';

describe('taskHashes', () => {
  it('scopes the task, fixture and expected hash to the task key', () => {
    expect(
      taskHashes({
        expectedHash: 'e1',
        outcomes: [],
        taskHash: 't1',
        taskKey: 'skills/a/trigger-1',
      }),
    ).toEqual([
      ['task:skills/a/trigger-1', 't1'],
      ['fixture:skills/a/trigger-1', undefined],
      ['expected:skills/a/trigger-1', 'e1'],
    ]);
  });
});
