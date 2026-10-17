import { describe, expect, it } from 'vite-plus/test';

import { flipChange } from './flipChange.util';

describe('flipChange', () => {
  it('calls a move toward failing a regression', () => {
    expect(flipChange({ after: 'mixed', before: 'pass' })).toBe('regressed');
    expect(flipChange({ after: 'fail', before: 'mixed' })).toBe('regressed');
  });

  it('calls a move toward passing an improvement', () => {
    expect(flipChange({ after: 'pass', before: 'fail' })).toBe('improved');
  });

  it('calls a task that appeared, vanished or went unscored a change', () => {
    expect(flipChange({ after: 'pass', before: 'absent' })).toBe('changed');
    expect(flipChange({ after: 'unscored', before: 'pass' })).toBe('changed');
  });
});
