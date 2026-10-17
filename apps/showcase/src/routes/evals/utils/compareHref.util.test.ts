import { describe, expect, it } from 'vite-plus/test';

import { compareHref } from './compareHref.util';

describe('compareHref', () => {
  it('links to the comparison of two runs, the earlier first', () => {
    expect(compareHref({ a: 'run-a', b: 'run-b' })).toBe(
      '/evals/compare?a=run-a&b=run-b',
    );
  });
});
