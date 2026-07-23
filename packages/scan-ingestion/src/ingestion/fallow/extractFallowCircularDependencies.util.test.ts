import { describe, expect, it } from 'vite-plus/test';

import { extractFallowCircularDependencies } from './extractFallowCircularDependencies.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowCircularDependencies', () => {
  it('maps cycles with entry_file_path denormalized from files[0]', () => {
    const raw = fallowRawSchema.parse({
      check: {
        circular_dependencies: [
          {
            col: 9,
            edges: [{ col: 9, line: 1, path: 'src/A.tsx' }],
            files: ['src/A.tsx', 'src/B.tsx'],
            length: 2,
            line: 1,
          },
        ],
      },
    });

    expect(extractFallowCircularDependencies({ raw })).toEqual([
      {
        col: 9,
        confidence: 'high',
        cycle_length: 2,
        edges: [{ col: 9, line: 1, path: 'src/A.tsx' }],
        effort: 'medium',
        entry_file_path: 'src/A.tsx',
        files: ['src/A.tsx', 'src/B.tsx'],
        finding_id: expect.any(String),
        fix: 'Extract the shared logic into a separate module to break the cycle.',
        line: 1,
        rule_id: 'fallow/circular-dependency',
        severity: 'MEDIUM',
        why: 'Import cycle of length 2: src/A.tsx → src/B.tsx.',
      },
    ]);
  });

  it('falls back to files.length when the length field is absent', () => {
    const raw = fallowRawSchema.parse({
      check: {
        circular_dependencies: [{ files: ['a.ts', 'b.ts', 'c.ts'] }],
      },
    });

    expect(extractFallowCircularDependencies({ raw })[0]).toMatchObject({
      cycle_length: 3,
    });
  });

  it('returns [] when the check section is missing', () => {
    expect(
      extractFallowCircularDependencies({ raw: fallowRawSchema.parse({}) }),
    ).toEqual([]);
  });
});
