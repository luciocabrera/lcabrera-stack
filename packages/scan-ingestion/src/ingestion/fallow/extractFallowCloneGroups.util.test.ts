import { describe, expect, it } from 'vitest';

import { extractFallowCloneGroups } from './extractFallowCloneGroups.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowCloneGroups', () => {
  it('maps dupes.clone_groups with nested instances, preserving array order', () => {
    const raw = fallowRawSchema.parse({
      dupes: {
        clone_groups: [
          {
            fingerprint: 'abc123',
            instances: [
              {
                end_col: 4,
                end_line: 19,
                file: 'src/editProject.action.ts',
                fragment: 'const paramsSchema = ...',
                start_col: 0,
                start_line: 7,
              },
              {
                end_line: 18,
                file: 'src/triggerScan.action.ts',
                start_line: 7,
              },
            ],
            line_count: 13,
            suggested_name: 'parseProjectParams',
            token_count: 120,
          },
          { instances: [], token_count: 50 },
        ],
      },
    });

    const groups = extractFallowCloneGroups({ raw });

    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({
      fingerprint: 'abc123',
      instances: [
        {
          end_col: 4,
          end_line: 19,
          file_path: 'src/editProject.action.ts',
          fragment: 'const paramsSchema = ...',
          start_col: 0,
          start_line: 7,
        },
        {
          end_col: undefined,
          end_line: 18,
          file_path: 'src/triggerScan.action.ts',
          fragment: undefined,
          start_col: undefined,
          start_line: 7,
        },
      ],
      line_count: 13,
      suggested_name: 'parseProjectParams',
      token_count: 120,
    });
    // NOT NULL columns always emitted, even when the raw group omits them.
    expect(groups[1]).toMatchObject({ line_count: 0, token_count: 50 });
  });

  it('returns [] when the dupes section is missing', () => {
    expect(
      extractFallowCloneGroups({ raw: fallowRawSchema.parse({}) }),
    ).toEqual([]);
  });
});
