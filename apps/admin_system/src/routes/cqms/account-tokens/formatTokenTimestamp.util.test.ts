import { describe, expect, it } from 'vitest';

import { formatTokenTimestamp } from './formatTokenTimestamp.util';

describe('formatTokenTimestamp', () => {
  it('formats an ISO timestamp as a space-separated slice', () => {
    expect(formatTokenTimestamp('2026-07-14T18:23:37.123Z')).toBe(
      '2026-07-14 18:23:37',
    );
  });

  it('renders an em dash for a missing (falsy) value', () => {
    expect(formatTokenTimestamp('')).toBe('—');
  });
});
