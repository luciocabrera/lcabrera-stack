import { describe, expect, it } from 'vite-plus/test';

import { sideLabels } from './sideLabels.util.ts';

describe('sideLabels', () => {
  it('labels each side with its branch', () => {
    expect(
      sideLabels({
        a: { branch: 'main', gitSha: 'a'.repeat(40) },
        b: { branch: 'feat/x', gitSha: 'b'.repeat(40) },
      }),
    ).toEqual({ a: 'main', b: 'feat/x' });
  });

  it('adds the short sha when both runs are on one branch', () => {
    expect(
      sideLabels({
        a: { branch: 'main', gitSha: `1234567${'a'.repeat(33)}` },
        b: { branch: 'main', gitSha: `89abcde${'b'.repeat(33)}` },
      }),
    ).toEqual({ a: 'main@1234567', b: 'main@89abcde' });
  });
});
