import { describe, expect, it } from 'vite-plus/test';

import { comparability } from './comparability.util.ts';

const run = { harnessVersion: 'aaaaaaaaaaaa', modelId: 'model-a' };

describe('comparability', () => {
  it('compares runs on the same model and harness', () => {
    expect(comparability({ main: run, pr: run })).toEqual({
      kind: 'comparable',
    });
  });

  it('refuses a different model even when the harness change is allowed', () => {
    expect(
      comparability({
        allowHarnessChange: true,
        main: run,
        pr: { ...run, modelId: 'model-b' },
      }),
    ).toEqual({ kind: 'incomparable', reason: 'model-changed' });
  });

  it('refuses a different harness unless the change is allowed', () => {
    const pr = { ...run, harnessVersion: 'bbbbbbbbbbbb' };

    expect(comparability({ main: run, pr })).toEqual({
      kind: 'incomparable',
      reason: 'harness-changed',
    });
    expect(comparability({ allowHarnessChange: true, main: run, pr })).toEqual({
      kind: 'comparable',
    });
  });
});
