import { describe, expect, it } from 'vitest';

import { getBadgeStyle } from './getBadgeStyle.util.ts';

describe('getBadgeStyle', () => {
  it('returns badgeYes style for "Yes"', () => {
    const result = getBadgeStyle('Yes');
    expect(result).toBeDefined();
  });

  it('returns badgeNo style for "No"', () => {
    const result = getBadgeStyle('No');
    expect(result).toBeDefined();
  });

  it('returns badgeNone style for other values', () => {
    const result = getBadgeStyle('Maybe');
    expect(result).toBeDefined();
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
