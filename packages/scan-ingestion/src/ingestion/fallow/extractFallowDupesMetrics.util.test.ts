import { describe, expect, it } from 'vite-plus/test';

import { extractFallowDupesMetrics } from './extractFallowDupesMetrics.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowDupesMetrics', () => {
  it('reads every duplication statistic', () => {
    const { dupes } = fallowRawSchema.parse({
      dupes: {
        stats: {
          clone_groups: 18,
          clone_instances: 40,
          duplicated_lines: 500,
          duplicated_tokens: 4000,
          duplication_percentage: 1.2,
          files_with_clones: 30,
          total_files: 1900,
          total_lines: 80_000,
          total_tokens: 600_000,
        },
      },
    });

    expect(extractFallowDupesMetrics({ stats: dupes?.stats })).toEqual({
      clone_group_count: 18,
      clone_instance_count: 40,
      dupes_duplicated_lines: 500,
      dupes_duplicated_tokens: 4000,
      dupes_files_with_clones: 30,
      dupes_total_files: 1900,
      dupes_total_lines: 80_000,
      dupes_total_tokens: 600_000,
      duplication_percentage: 1.2,
    });
  });

  it('zeroes only the NOT NULL counts when the stats block is absent', () => {
    expect(extractFallowDupesMetrics({ stats: undefined })).toEqual({
      clone_group_count: 0,
      clone_instance_count: 0,
    });
  });

  it('keeps the schema-defaulted counts at 0 for a present but empty block', () => {
    const { dupes } = fallowRawSchema.parse({ dupes: { stats: {} } });

    const metrics = extractFallowDupesMetrics({ stats: dupes?.stats });

    expect(metrics.clone_group_count).toBe(0);
    expect(metrics.dupes_total_files).toBeUndefined();
  });
});
