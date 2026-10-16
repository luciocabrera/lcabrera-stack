import { describe, expect, it } from 'vite-plus/test';

import { errorReason } from './errorReason.util.ts';

const REFUSED = Object.assign(new Error('connect ECONNREFUSED ::1'), {
  code: 'ECONNREFUSED',
});

describe('errorReason', () => {
  it('keeps a message that already names its code', () => {
    expect(errorReason(REFUSED)).toBe('connect ECONNREFUSED ::1');
  });

  it('prefixes a code the message leaves out', () => {
    const missing = Object.assign(new Error('relation does not exist'), {
      code: '42P01',
    });

    expect(errorReason(missing)).toBe('42P01: relation does not exist');
  });

  it('reads the first error of an aggregate', () => {
    expect(
      errorReason(new AggregateError([REFUSED], 'every address refused')),
    ).toBe('connect ECONNREFUSED ::1');
  });

  it('reads a thrown value that is not an error', () => {
    expect(errorReason('timeout')).toBe('timeout');
  });
});
