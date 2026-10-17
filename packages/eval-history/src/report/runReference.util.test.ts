import { describe, expect, it } from 'vite-plus/test';

import { reportRunFixture } from './reportRunFixture.util.ts';
import { runReference } from './runReference.util.ts';

const run = reportRunFixture();

describe('runReference', () => {
  it('keeps what names a run and drops its trials and hashes', () => {
    expect(runReference(run)).toEqual({
      branch: 'main',
      gitSha: 'a'.repeat(40),
      modelId: 'model-a',
      runId: 'run-a',
      suite: 'skills',
    });
  });
});
