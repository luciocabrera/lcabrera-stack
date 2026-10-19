import { describe, expect, it } from 'vite-plus/test';

import { retainSummary } from './retainSummary.util.ts';

describe('retainSummary', () => {
  it('names both counts and the rule each one applied', () => {
    expect(retainSummary({ snapshots: 2, transcripts: 7 })).toBe(
      'evals:retain: pruned 7 transcript pointer(s) older than 90 days outside main and baseline runs; trimmed 2 content snapshot(s) beyond the newest 20 per subject',
    );
  });
});
