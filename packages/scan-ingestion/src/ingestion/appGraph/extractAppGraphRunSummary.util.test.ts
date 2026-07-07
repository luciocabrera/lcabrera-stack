import { describe, expect, it } from 'vitest';

import { appGraphRawSchema } from './appGraphRaw.schema.ts';
import { extractAppGraphRunSummary } from './extractAppGraphRunSummary.util.ts';

describe('extractAppGraphRunSummary', () => {
  it('derives all aggregates from the nodes array, not the stats block', () => {
    const raw = appGraphRawSchema.parse({
      kind: 'app-graph',
      nodes: [
        {
          child_file_count: 1,
          child_folder_count: 1,
          node_id: 1,
          node_type: 'folder',
          path: '.',
        },
        {
          nested_level: 1,
          node_id: 2,
          node_type: 'folder',
          parent_node_id: 1,
          path: 'src',
        },
        {
          export_count: 3,
          function_count: 2,
          is_analyzed: true,
          line_count: 120,
          nested_level: 2,
          node_id: 3,
          node_type: 'file',
          parent_node_id: 2,
          path: 'src/a.util.ts',
          type_count: 1,
        },
        {
          line_count: 40,
          nested_level: 1,
          node_id: 4,
          node_type: 'file',
          parent_node_id: 1,
          path: 'README.md',
        },
      ],
      // Deliberately contradicts the nodes — must be ignored.
      stats: { file_count: 999 },
    });

    expect(extractAppGraphRunSummary({ raw })).toEqual({
      analyzed_file_count: 1,
      file_count: 2,
      folder_count: 2,
      max_depth: 2,
      total_export_count: 3,
      total_function_count: 2,
      total_line_count: 160,
      total_node_count: 4,
      total_type_count: 1,
    });
  });

  it('returns zeros for an empty run and skips null line counts', () => {
    expect(
      extractAppGraphRunSummary({ raw: appGraphRawSchema.parse({}) }),
    ).toEqual({
      analyzed_file_count: 0,
      file_count: 0,
      folder_count: 0,
      max_depth: 0,
      total_export_count: 0,
      total_function_count: 0,
      total_line_count: 0,
      total_node_count: 0,
      total_type_count: 0,
    });

    const rawWithUnreadableFile = appGraphRawSchema.parse({
      nodes: [{ node_id: 1, node_type: 'file', path: 'image.png' }],
    });
    expect(
      extractAppGraphRunSummary({ raw: rawWithUnreadableFile })
        .total_line_count,
    ).toBe(0);
  });
});
