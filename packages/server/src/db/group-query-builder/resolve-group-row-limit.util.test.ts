import { describe, expect, it } from 'vite-plus/test';

import { resolveGroupRowLimit } from './resolve-group-row-limit.util.ts';

describe('resolveGroupRowLimit', () => {
  it('keeps the caller’s ceiling when the result was estimated', () => {
    // The estimate already passed the refuse threshold, so there is nothing for
    // a backstop to catch.
    expect(
      resolveGroupRowLimit({
        estimate: { kind: 'known', rows: 120 },
        maxRows: 20_000,
      }),
    ).toEqual({ limit: 20_000 });
  });

  it('caps an unestimated read at the warn threshold plus one', () => {
    expect(
      resolveGroupRowLimit({
        estimate: { columns: ['city'], kind: 'unknown' },
        maxRows: 20_000,
      }),
    ).toEqual({ backstopAt: 5001, limit: 5001 });
  });

  it('leaves a tighter caller ceiling alone and marks no backstop', () => {
    // Reaching a limit the caller chose is truncation it asked for, not
    // evidence that the grouping was too large.
    expect(
      resolveGroupRowLimit({
        estimate: { columns: ['city'], kind: 'unknown' },
        maxRows: 400,
      }),
    ).toEqual({ limit: 400 });
  });

  it('marks the backstop when the caller ceiling equals it exactly', () => {
    expect(
      resolveGroupRowLimit({
        estimate: { columns: ['city'], kind: 'unknown' },
        maxRows: 5001,
      }),
    ).toEqual({ backstopAt: 5001, limit: 5001 });
  });
});
