import { describe, expect, it } from 'vitest';

import { extractFallowCodeHealthSignals } from './extractFallowCodeHealthSignals.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowCodeHealthSignals', () => {
  it('reads the complexity, size, maintainability and hotspot signals', () => {
    const { health } = fallowRawSchema.parse({
      health: {
        vital_signs: {
          avg_cyclomatic: 1.8,
          critical_complexity_pct: 0.4,
          functions_over_60_loc_per_k: 2.1,
          hotspot_count: 159,
          hotspot_top_pct_count: 12,
          maintainability_avg: 93.2,
          maintainability_low_pct: 1.1,
          p90_cyclomatic: 4,
          total_loc: 81_053,
          unit_interfacing_profile: { low_risk: 99.7 },
          unit_size_profile: { low_risk: 73.2 },
        },
      },
    });

    expect(
      extractFallowCodeHealthSignals({ vitalSigns: health?.vital_signs }),
    ).toEqual({
      avg_cyclomatic: 1.8,
      critical_complexity_pct: 0.4,
      functions_over_60_loc_per_k: 2.1,
      hotspot_count: 159,
      hotspot_top_pct_count: 12,
      maintainability_avg: 93.2,
      maintainability_low_pct: 1.1,
      p90_cyclomatic: 4,
      total_loc: 81_053,
      unit_interfacing_profile: { low_risk: 99.7 },
      unit_size_profile: { low_risk: 73.2 },
    });
  });

  it('returns nothing at all when vital signs are absent', () => {
    expect(extractFallowCodeHealthSignals({ vitalSigns: undefined })).toEqual(
      {},
    );
  });

  it('does not claim the graph half of the section', () => {
    const { health } = fallowRawSchema.parse({
      health: { vital_signs: { avg_cyclomatic: 1.8, dead_file_pct: 0.5 } },
    });

    expect(
      extractFallowCodeHealthSignals({ vitalSigns: health?.vital_signs }),
    ).not.toHaveProperty('dead_file_pct');
  });
});
