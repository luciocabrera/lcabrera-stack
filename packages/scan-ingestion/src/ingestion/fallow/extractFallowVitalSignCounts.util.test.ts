import { describe, expect, it } from 'vitest';

import { extractFallowVitalSignCounts } from './extractFallowVitalSignCounts.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowVitalSignCounts', () => {
  it('reads the totals behind the vital-sign percentages', () => {
    const { health } = fallowRawSchema.parse({
      health: {
        vital_signs: {
          counts: {
            dead_exports: 68,
            dead_files: 9,
            total_deps: 0,
            total_exports: 2399,
            total_files: 1937,
            total_lines: 81_053,
          },
        },
      },
    });

    expect(
      extractFallowVitalSignCounts({ counts: health?.vital_signs?.counts }),
    ).toEqual({
      dead_exports: 68,
      dead_files: 9,
      total_deps: 0,
      total_exports: 2399,
      total_files: 1937,
      total_lines: 81_053,
    });
  });

  it('returns nothing at all when the counts block is absent', () => {
    expect(extractFallowVitalSignCounts({ counts: undefined })).toEqual({});
  });

  it('preserves a genuine 0 rather than dropping it as absent', () => {
    const { health } = fallowRawSchema.parse({
      health: { vital_signs: { counts: { total_deps: 0 } } },
    });

    expect(
      extractFallowVitalSignCounts({ counts: health?.vital_signs?.counts })
        .total_deps,
    ).toBe(0);
  });
});
