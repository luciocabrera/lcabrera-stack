import { describe, expect, it } from 'vite-plus/test';

import { isTaskOfSubject } from './isTaskOfSubject.util.ts';

const task = { subject: { kind: 'skill', name: 'react-19' } };

describe('isTaskOfSubject', () => {
  it('matches a task to its own subject by kind and name', () => {
    expect(isTaskOfSubject({ subject: task.subject, task })).toBe(true);
    expect(
      isTaskOfSubject({ subject: { kind: 'rule', name: 'react-19' }, task }),
    ).toBe(false);
  });

  it('matches every task to the suite as a whole', () => {
    expect(isTaskOfSubject({ subject: undefined, task })).toBe(true);
  });
});
