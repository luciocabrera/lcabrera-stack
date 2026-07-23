import { describe, expect, it } from 'vite-plus/test';

import { extractFallowGraphSignals } from './extractFallowGraphSignals.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowGraphSignals', () => {
  it('reads the coupling, fan-in, dead-code, dependency and cycle signals', () => {
    const { health } = fallowRawSchema.parse({
      health: {
        vital_signs: {
          circular_dep_count: 2,
          circular_deps_per_k_files: 1.03,
          coupling_high_pct: 3.4,
          dead_export_pct: 2.8,
          dead_file_pct: 0.5,
          max_render_fan_in: 42,
          p95_fan_in: 5,
          p95_render_fan_in: 9,
          render_fan_in_high_pct: 1.2,
          top_render_fan_in: [{ component: 'FormFieldChrome' }],
          unused_dep_count: 4,
          unused_deps_per_k_files: 2.06,
        },
      },
    });

    expect(
      extractFallowGraphSignals({ vitalSigns: health?.vital_signs }),
    ).toEqual({
      circular_dep_count: 2,
      circular_deps_per_k_files: 1.03,
      coupling_high_pct: 3.4,
      dead_export_pct: 2.8,
      dead_file_pct: 0.5,
      max_render_fan_in: 42,
      p95_fan_in: 5,
      p95_render_fan_in: 9,
      render_fan_in_high_pct: 1.2,
      top_render_fan_in: [{ component: 'FormFieldChrome' }],
      unused_dep_count: 4,
      unused_deps_per_k_files: 2.06,
    });
  });

  it('returns nothing at all when vital signs are absent', () => {
    expect(extractFallowGraphSignals({ vitalSigns: undefined })).toEqual({});
  });

  it('does not claim the code-health half of the section', () => {
    const { health } = fallowRawSchema.parse({
      health: { vital_signs: { avg_cyclomatic: 1.8, dead_file_pct: 0.5 } },
    });

    expect(
      extractFallowGraphSignals({ vitalSigns: health?.vital_signs }),
    ).not.toHaveProperty('avg_cyclomatic');
  });
});
