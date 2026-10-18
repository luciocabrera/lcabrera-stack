import { describe, expect, it } from 'vite-plus/test';

import { isTaskOfSubject } from './isTaskOfSubject.util.ts';

const task = { subject: { kind: 'skill', name: 'react-19' } };

const NONE = new Set<string>();

describe('isTaskOfSubject', () => {
  it('matches a task to its own subject by kind and name', () => {
    expect(
      isTaskOfSubject({ baselined: NONE, subject: task.subject, task }),
    ).toBe(true);
    expect(
      isTaskOfSubject({
        baselined: NONE,
        subject: { kind: 'rule', name: 'react-19' },
        task,
      }),
    ).toBe(false);
  });

  it('counts a task toward the suite only when the baseline covers its subject', () => {
    expect(
      isTaskOfSubject({
        baselined: new Set(['skill:react-19']),
        subject: undefined,
        task,
      }),
    ).toBe(true);
    expect(
      isTaskOfSubject({
        baselined: new Set(['skill:unslop']),
        subject: undefined,
        task,
      }),
    ).toBe(false);
  });

  it('counts every task toward the suite when the baseline has no subject rows', () => {
    expect(isTaskOfSubject({ baselined: NONE, subject: undefined, task })).toBe(
      true,
    );
  });
});
