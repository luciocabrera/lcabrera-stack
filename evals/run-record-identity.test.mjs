import { describe, expect, it } from 'vite-plus/test';

import { STARTED_AT } from './envelope-test-support.mjs';
import { runIdentity } from './run-record.mjs';

describe('runIdentity', () => {
  it('reads the commit and mints a fresh uuid each run', () => {
    const identity = runIdentity({ env: {}, now: STARTED_AT });
    expect(identity.git_sha).toMatch(/^[0-9a-f]{40}$/u);
    expect(identity.trigger).toBe('local');
    expect(identity.baseline_id).toBeNull();
    expect(identity.started_at).toBe('2026-10-06T09:00:00.000Z');
    expect(runIdentity({ env: {} }).run_id).not.toBe(identity.run_id);
  });

  it('tags the run with the baseline id the baseline command passes down', () => {
    const baselineId = 'b8f1c0de-0000-4000-8000-000000000001';
    const identity = runIdentity({ env: { EVALS_BASELINE_ID: baselineId } });

    expect(identity.baseline_id).toBe(baselineId);
    expect(identity.trigger).toBe('baseline');
  });
});
