import { describe, expect, it } from 'vite-plus/test';

import { taskTally } from './taskTally.util';

describe('taskTally', () => {
  it('counts passes over scored trials', () => {
    expect(taskTally({ k: 2, n: 3, outcomes: ['pass', 'fail', 'pass'] })).toBe(
      '2/3',
    );
  });

  it('names the trials that were not scored', () => {
    expect(taskTally({ k: 1, n: 2, outcomes: ['pass', 'error', 'fail'] })).toBe(
      '1/2, 1 not scored',
    );
  });

  it('says when the task did not run', () => {
    expect(taskTally({ k: undefined, n: undefined, outcomes: undefined })).toBe(
      'not run',
    );
  });
});
