import { describe, expect, it } from 'vite-plus/test';

import { refusalReason } from './refusalReason.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';

const run = reportRunFixture();

const otherModel = reportRunFixture({ modelId: 'model-b' });

describe('refusalReason', () => {
  it('accepts two runs of one suite and one model', () => {
    expect(
      refusalReason({ a: run, allowModelChange: false, b: run }),
    ).toBeUndefined();
  });

  it('refuses a model change unless it is allowed', () => {
    expect(
      refusalReason({ a: run, allowModelChange: false, b: otherModel }),
    ).toBe('model-changed');
    expect(
      refusalReason({ a: run, allowModelChange: true, b: otherModel }),
    ).toBeUndefined();
  });

  it('refuses two suites even when a model change is allowed', () => {
    expect(
      refusalReason({
        a: run,
        allowModelChange: true,
        b: { ...otherModel, suite: 'verifier-fixtures' },
      }),
    ).toBe('suite-mismatch');
  });
});
