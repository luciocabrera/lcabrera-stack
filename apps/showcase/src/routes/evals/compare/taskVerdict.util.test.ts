import { describe, expect, it } from 'vite-plus/test';

import { taskVerdict } from './taskVerdict.util';

describe('taskVerdict', () => {
  it('reads a task that did not run in a run as absent', () => {
    expect(taskVerdict({ k: undefined, n: undefined })).toBe('absent');
  });

  it('reads a task with no scored trial as unscored', () => {
    expect(taskVerdict({ k: 0, n: 0 })).toBe('unscored');
  });

  it('tells every trial passing from none and from some', () => {
    expect(taskVerdict({ k: 3, n: 3 })).toBe('pass');
    expect(taskVerdict({ k: 0, n: 3 })).toBe('fail');
    expect(taskVerdict({ k: 1, n: 3 })).toBe('mixed');
  });
});
