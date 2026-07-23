import { describe, expect, it } from 'vite-plus/test';

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

  it('excludes ADR-027 symbol nodes from file/folder counts and every file-derived total, but still counts them in total_node_count and max_depth', () => {
    const raw = appGraphRawSchema.parse({
      nodes: [
        {
          child_file_count: 1,
          child_folder_count: 0,
          node_id: 1,
          node_type: 'folder',
          path: '.',
        },
        {
          export_count: 3,
          function_count: 2,
          is_analyzed: true,
          line_count: 120,
          nested_level: 1,
          node_id: 2,
          node_type: 'file',
          parent_node_id: 1,
          path: 'src/a.hook.ts',
          type_count: 1,
        },
        // A symbol row: if it were still lumped in via the old `!==
        // 'folder'` shorthand it would double every file-derived total
        // below (export/function/type/line counts, file_count,
        // analyzed_file_count) — it must be excluded from all of them.
        {
          end_line: 40,
          export_count: 999,
          function_count: 999,
          is_analyzed: true,
          line_count: 999,
          nested_level: 2,
          node_id: 3,
          node_type: 'function',
          parent_node_id: 2,
          path: 'src/a.hook.ts',
          start_line: 1,
          symbol_name: 'useA',
          type_count: 999,
        },
      ],
    });

    const summary = extractAppGraphRunSummary({ raw });

    expect(summary).toEqual({
      analyzed_file_count: 1,
      file_count: 1,
      folder_count: 1,
      // max_depth reflects the symbol node's deeper nesting (2), not just
      // the file tree's depth (1) — this is intentional, see the
      // extractor's doc comment.
      max_depth: 2,
      total_export_count: 3,
      total_function_count: 2,
      total_line_count: 120,
      // total_node_count is whole-tree: folder + file + symbol = 3.
      total_node_count: 3,
      total_type_count: 1,
    });
  });
});
