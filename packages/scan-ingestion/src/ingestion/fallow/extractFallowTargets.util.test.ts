import { describe, expect, it } from 'vite-plus/test';

import { extractFallowTargets } from './extractFallowTargets.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowTargets', () => {
  it('maps health.targets keeping factors/evidence as structured blobs', () => {
    const raw = fallowRawSchema.parse({
      health: {
        targets: [
          {
            actions: [
              {
                auto_fixable: false,
                description: 'Break the cycle',
                type: 'apply-refactoring',
              },
            ],
            category: 'break_circular_dependency',
            confidence: 'high',
            efficiency: 13.8,
            effort: 'medium',
            evidence: { cycle_path: ['src/A.tsx', 'src/B.tsx'] },
            factors: [{ metric: 'fan_in', threshold: 3, value: 4 }],
            path: 'src/FormFields.component.tsx',
            priority: 27.6,
            recommendation: 'Break import cycle',
          },
        ],
      },
    });

    expect(extractFallowTargets({ raw })).toEqual([
      {
        actions: [
          {
            auto_fixable: false,
            description: 'Break the cycle',
            type: 'apply-refactoring',
          },
        ],
        category: 'break_circular_dependency',
        confidence: 'high',
        efficiency: 13.8,
        effort: 'medium',
        evidence: { cycle_path: ['src/A.tsx', 'src/B.tsx'] },
        factors: [{ metric: 'fan_in', threshold: 3, value: 4 }],
        file_path: 'src/FormFields.component.tsx',
        priority: 27.6,
        recommendation: 'Break import cycle',
      },
    ]);
  });

  it('returns [] when the health section is missing', () => {
    expect(extractFallowTargets({ raw: fallowRawSchema.parse({}) })).toEqual(
      [],
    );
  });
});
