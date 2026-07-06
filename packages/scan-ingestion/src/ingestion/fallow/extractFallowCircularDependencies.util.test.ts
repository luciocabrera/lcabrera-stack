import { describe, expect, it } from 'vitest';

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
        cycle_length: 2,
        edges: [{ col: 9, line: 1, path: 'src/A.tsx' }],
        entry_file_path: 'src/A.tsx',
        files: ['src/A.tsx', 'src/B.tsx'],
        line: 1,
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
