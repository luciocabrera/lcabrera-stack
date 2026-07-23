import { describe, expect, it } from 'vite-plus/test';

import { extractFallowCheckMetrics } from './extractFallowCheckMetrics.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowCheckMetrics', () => {
  it('reads the dead-code section totals and jsonb blobs', () => {
    const { check } = fallowRawSchema.parse({
      check: {
        entry_points: { sources: { plugin: 544 }, total: 610 },
        summary: { unused_files: 9 },
        total_issues: 83,
      },
    });

    expect(extractFallowCheckMetrics({ check })).toEqual({
      check_summary: { unused_files: 9 },
      check_total_issues: 83,
      entry_points: { sources: { plugin: 544 }, total: 610 },
    });
  });

  it('zeroes the NOT NULL total when the section is absent', () => {
    expect(extractFallowCheckMetrics({ check: undefined })).toEqual({
      check_summary: undefined,
      check_total_issues: 0,
      entry_points: undefined,
    });
  });
});
