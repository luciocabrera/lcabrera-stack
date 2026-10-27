import { describe, expect, it } from 'vite-plus/test';

import type { GroupingRefusalReason } from './errors.types.ts';

import { GROUPING_REFUSALS } from './errors.constants.ts';
import { GroupingRefusedError } from './grouping-refused.error.ts';
import { toGroupingRefused } from './to-grouping-refused.util.ts';

const REQUEST_TEXT = 'hidden_note';

const REASONS = Object.keys(GROUPING_REFUSALS) as GroupingRefusalReason[];

const refusalNaming = (reason: GroupingRefusalReason) =>
  new GroupingRefusedError({
    column: REQUEST_TEXT,
    message: `Column "${REQUEST_TEXT}" was refused.`,
    reason,
  });

describe('toGroupingRefused', () => {
  it.each(REASONS)(
    'writes a fixed sentence for %s, never the error message',
    (reason) => {
      const mapped = toGroupingRefused(refusalNaming(reason));

      expect(mapped.message).toBe(GROUPING_REFUSALS[reason].message);
      expect(mapped.message).not.toContain(REQUEST_TEXT);
    },
  );

  it.each(['duplicate-keys', 'unknown-column'] as const)(
    'withholds the column of %s, which can reach it before the allow-list',
    (reason) => {
      const mapped = toGroupingRefused(refusalNaming(reason));

      expect(mapped).toStrictEqual({
        kind: 'grouping-refused',
        message: GROUPING_REFUSALS[reason].message,
        reason,
      });
      expect(JSON.stringify(mapped)).not.toContain(REQUEST_TEXT);
    },
  );

  it.each([
    'aggregate-not-legal',
    'column-axis-too-wide',
    'column-not-groupable',
    'estimate-too-large',
  ] as const)('keeps the allow-listed column of %s', (reason) => {
    expect(toGroupingRefused(refusalNaming(reason))).toMatchObject({
      column: REQUEST_TEXT,
      reason,
    });
  });

  it('carries the estimated rows and omits a column the refusal did not name', () => {
    expect(
      toGroupingRefused(
        new GroupingRefusedError({
          estimatedRows: 6000,
          message: 'This grouping returned at least 6000 rows.',
          reason: 'row-limit-reached',
        }),
      ),
    ).toStrictEqual({
      estimatedRows: 6000,
      kind: 'grouping-refused',
      message: GROUPING_REFUSALS['row-limit-reached'].message,
      reason: 'row-limit-reached',
    });
  });

  it('produces plain data that survives a structured clone unchanged', () => {
    const mapped = toGroupingRefused(refusalNaming('column-not-groupable'));

    expect(structuredClone(mapped)).toStrictEqual(mapped);
  });
});
