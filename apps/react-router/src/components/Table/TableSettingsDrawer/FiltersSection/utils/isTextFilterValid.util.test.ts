import { describe, expect, it } from 'vitest';

import { isTextFilterValid } from './isTextFilterValid.util';

describe('isTextFilterValid', () => {
  it('returns false for empty string', () => {
    expect(
      isTextFilterValid({ operator: 'equals', type: 'text', value: '' }),
    ).toBe(false);
  });

  it('returns false for whitespace-only string', () => {
    expect(
      isTextFilterValid({ operator: 'contains', type: 'text', value: '  ' }),
    ).toBe(false);
  });

  it('returns true for non-empty string', () => {
    expect(
      isTextFilterValid({ operator: 'contains', type: 'text', value: 'hello' }),
    ).toBe(true);
  });

  it('returns true for string with surrounding whitespace', () => {
    expect(
      isTextFilterValid({ operator: 'equals', type: 'text', value: ' hello ' }),
    ).toBe(true);
  });
});
