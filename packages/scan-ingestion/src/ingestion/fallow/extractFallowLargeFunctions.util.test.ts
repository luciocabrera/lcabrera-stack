import { describe, expect, it } from 'vitest';

import { extractFallowLargeFunctions } from './extractFallowLargeFunctions.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowLargeFunctions', () => {
  it('maps health.large_functions including anonymous <arrow> entries', () => {
    const raw = fallowRawSchema.parse({
      health: {
        large_functions: [
          {
            line: 137,
            line_count: 303,
            name: '<arrow>',
            path: 'src/useBatch.hook.test.ts',
          },
        ],
      },
    });

    expect(extractFallowLargeFunctions({ raw })).toEqual([
      {
        file_path: 'src/useBatch.hook.test.ts',
        function_name: '<arrow>',
        line: 137,
        line_count: 303,
      },
    ]);
  });

  it('returns [] when the health section is missing', () => {
    expect(
      extractFallowLargeFunctions({ raw: fallowRawSchema.parse({}) }),
    ).toEqual([]);
  });
});
