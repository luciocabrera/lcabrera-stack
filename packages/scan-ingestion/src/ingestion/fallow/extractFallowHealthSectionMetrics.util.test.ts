import { describe, expect, it } from 'vite-plus/test';

import { extractFallowHealthSectionMetrics } from './extractFallowHealthSectionMetrics.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowHealthSectionMetrics', () => {
  it("reads the health section's own jsonb blobs", () => {
    const { health } = fallowRawSchema.parse({
      health: {
        framework_health: { detected_frameworks: ['react'] },
        hotspot_summary: { min_commits: 3, since: '6 months' },
        target_thresholds: { fan_in_p95: 5 },
      },
    });

    expect(extractFallowHealthSectionMetrics({ health })).toEqual({
      framework_health: { detected_frameworks: ['react'] },
      hotspot_summary: { min_commits: 3, since: '6 months' },
      target_thresholds: { fan_in_p95: 5 },
    });
  });

  it('leaves every field undefined when the health section is absent', () => {
    expect(extractFallowHealthSectionMetrics({ health: undefined })).toEqual({
      framework_health: undefined,
      hotspot_summary: undefined,
      target_thresholds: undefined,
    });
  });
});
