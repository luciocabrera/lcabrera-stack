import { describe, expect, it } from 'vite-plus/test';

import { isRecordedHash } from './isRecordedHash.util.ts';

describe('isRecordedHash', () => {
  it('keeps an entry with a hash and drops one without', () => {
    expect(isRecordedHash(['catalog', 'abc'])).toBe(true);
    expect(isRecordedHash(['catalog', undefined])).toBe(false);
  });
});
