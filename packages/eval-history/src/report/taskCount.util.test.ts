import { describe, expect, it } from 'vite-plus/test';

import { taskCount } from './taskCount.util.ts';

describe('taskCount', () => {
  it('is absent for a task the run does not have', () => {
    expect(taskCount(undefined)).toBeUndefined();
  });

  it('counts passed and counted trials, and the ones left out', () => {
    expect(taskCount(['pass', 'fail', 'error'])).toMatchObject({
      excluded: 1,
      k: 1,
      n: 2,
    });
  });
});
