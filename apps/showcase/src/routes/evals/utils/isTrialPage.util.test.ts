import { describe, expect, it } from 'vite-plus/test';

import { isTrialPage } from './isTrialPage.util';

describe('isTrialPage', () => {
  it('accepts a page of trials with its total', () => {
    expect(isTrialPage({ data: [], total: 0 })).toBe(true);
  });

  it.each([
    undefined,
    'page',
    [],
    { data: [] },
    { data: {}, total: 1 },
    { total: 1 },
  ])('refuses %j', (value) => {
    expect(isTrialPage(value)).toBe(false);
  });
});
