import { describe, expect, it } from 'vite-plus/test';

import { costText } from './costText.util.ts';

describe('costText', () => {
  it('prints a reported cost in dollars', () => {
    expect(costText({ costUsdReported: 1.2 })).toBe('$1.20 reported');
  });

  it('says when no cost was reported', () => {
    expect(costText({})).toBe('not reported');
  });
});
