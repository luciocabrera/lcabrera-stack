import { describe, expect, it } from 'vite-plus/test';

import { findingSubject } from './findingSubject.util.ts';

const RATE = { k: 1, kind: 'insufficient', n: 1 } as const;

describe('findingSubject', () => {
  it('names the pass rate for a rate finding', () => {
    expect(findingSubject({ kind: 'rate', main: RATE, pr: RATE })).toBe(
      'the suite pass rate',
    );
  });

  it("names a flip's subject", () => {
    expect(
      findingSubject({
        failed: 2,
        kind: 'flip',
        subject: { kind: 'skill', name: 'epic' },
        taskKey: 'epic/trigger',
        trials: 3,
      }),
    ).toBe('skill `epic`');
  });
});
