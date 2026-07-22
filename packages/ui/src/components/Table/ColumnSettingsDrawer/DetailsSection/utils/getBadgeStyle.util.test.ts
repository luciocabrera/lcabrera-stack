import { describe, expect, it } from 'vitest';

import { getBadgeStyle } from './getBadgeStyle.util';

describe('getBadgeStyle', () => {
  it.each(['Yes', 'No', 'Maybe'])('returns a style for %s', (value) => {
    expect(getBadgeStyle(value)).toBeDefined();
  });

  it('returns different styles for Yes, No, and other', () => {
    const yes = getBadgeStyle('Yes');
    const no = getBadgeStyle('No');
    const none = getBadgeStyle('Other');
    expect(yes).not.toBe(no);
    expect(yes).not.toBe(none);
    expect(no).not.toBe(none);
  });
});
