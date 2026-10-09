import { describe, expect, it } from 'vite-plus/test';

import { evalsHref } from './evalsHref.util';

describe('evalsHref', () => {
  it('links to a run', () => {
    expect(evalsHref({ runId: 'abc' })).toBe('/evals/runs/abc');
  });

  it('links to one trial of a run', () => {
    expect(evalsHref({ runId: 'abc', trialId: '42' })).toBe(
      '/evals/runs/abc?trial=42',
    );
  });
});
