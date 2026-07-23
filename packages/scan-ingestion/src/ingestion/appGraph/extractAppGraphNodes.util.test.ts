import { describe, expect, it } from 'vite-plus/test';

import { appGraphRawSchema } from './appGraphRaw.schema.ts';
import { extractAppGraphNodes } from './extractAppGraphNodes.util.ts';

describe('extractAppGraphNodes', () => {
  it('maps nodes to rows, classifying files and omitting nullable keys', () => {
    const raw = appGraphRawSchema.parse({
      nodes: [
        {
          child_file_count: 1,
          child_folder_count: 0,
          name: 'queries',
          nested_level: 0,
          node_id: 1,
          node_type: 'folder',
          path: 'src/queries',
        },
        {
          export_count: 2,
          extension: '.ts',
          function_count: 1,
          is_analyzed: true,
          line_count: 66,
          name: 'triggerScan.util.ts',
          nested_level: 1,
          node_id: 2,
          node_type: 'file',
          parent_node_id: 1,
          path: 'src/queries/triggerScan.util.ts',
          type_count: 2,
        },
      ],
    });

    const [folderRow, fileRow] = extractAppGraphNodes({ raw });

    expect(folderRow).toEqual({
      child_file_count: 1,
      child_folder_count: 0,
      export_count: 0,
      extension: '',
      function_count: 0,
      name: 'queries',
      nested_level: 0,
      node_id: 1,
      node_type: 'folder',
      path: 'src/queries',
      type_count: 0,
    });
    // No parent_node_id / file_type_category / line_count keys at all —
    // jsonb_to_recordset turns the absent keys into SQL NULL.
    expect(folderRow).not.toHaveProperty('parent_node_id');
    expect(folderRow).not.toHaveProperty('file_type_category');
    expect(folderRow).not.toHaveProperty('line_count');

    expect(fileRow).toEqual({
      child_file_count: 0,
      child_folder_count: 0,
      export_count: 2,
      extension: '.ts',
      file_type_category: 'util',
      function_count: 1,
      line_count: 66,
      name: 'triggerScan.util.ts',
      nested_level: 1,
      node_id: 2,
      node_type: 'file',
      parent_node_id: 1,
      path: 'src/queries/triggerScan.util.ts',
      type_count: 2,
    });
  });

  it('drops nodes without a node_id and drops nodes with an unrecognized node_type', () => {
    const raw = appGraphRawSchema.parse({
      nodes: [
        { name: 'ghost.ts', node_type: 'file', path: 'ghost.ts' },
        {
          name: 'weird.ts',
          node_id: 7,
          node_type: 'symlink',
          path: 'weird.ts',
        },
        {
          name: 'real.ts',
          node_id: 8,
          node_type: 'file',
          path: 'real.ts',
        },
      ],
    });

    const rows = extractAppGraphNodes({ raw });

    // 'symlink' is outside the CHECK constraint's known set and can no
    // longer be safely coerced onto 'file' now that 'file' means something
    // specific (only 'file' rows get a file_type_category) — it's dropped,
    // same as a node missing its node_id.
    expect(rows).toHaveLength(1);
    expect(rows[0]?.node_id).toBe(8);
    expect(rows[0]?.node_type).toBe('file');
    expect(rows[0]?.file_type_category).toBe('other');
  });

  it('passes through every ADR-027 symbol node type with its symbol fields, nested under its file', () => {
    const raw = appGraphRawSchema.parse({
      nodes: [
        {
          child_file_count: 1,
          child_folder_count: 0,
          name: 'useThing.hook.ts',
          nested_level: 0,
          node_id: 1,
          node_type: 'file',
          path: 'src/useThing.hook.ts',
        },
        {
          end_line: 12,
          is_exported: true,
          is_hook: true,
          name: 'useThing',
          nested_level: 1,
          node_id: 2,
          node_type: 'function',
          parent_node_id: 1,
          path: 'src/useThing.hook.ts',
          start_line: 1,
          symbol_name: 'useThing',
        },
        {
          end_line: 10,
          is_exported: false,
          name: 'formatValue',
          nested_level: 2,
          node_id: 3,
          node_type: 'function',
          parent_node_id: 2,
          path: 'src/useThing.hook.ts',
          start_line: 5,
          symbol_name: 'formatValue',
        },
      ],
    });

    const [fileRow, hookRow, nestedRow] = extractAppGraphNodes({ raw });

    expect(fileRow?.node_type).toBe('file');
    expect(fileRow?.file_type_category).toBe('hook');

    expect(hookRow).toMatchObject({
      end_line: 12,
      is_exported: true,
      is_hook: true,
      node_id: 2,
      node_type: 'function',
      parent_node_id: 1,
      start_line: 1,
      symbol_name: 'useThing',
    });
    // Symbol rows never get a file_type_category, even nested under a
    // 'function' node_type that isn't 'file'.
    expect(hookRow).not.toHaveProperty('file_type_category');
    expect(hookRow?.is_component).toBeUndefined();

    // A nested, non-exported helper: is_exported false is still emitted
    // (a real fact worth keeping), but no is_hook/is_component tagging —
    // that heuristic only ever applies to top-level exported symbols,
    // which is entirely the runner's responsibility, not re-verified here.
    expect(nestedRow).toMatchObject({
      is_exported: false,
      node_id: 3,
      node_type: 'function',
      parent_node_id: 2,
      symbol_name: 'formatValue',
    });
    expect(nestedRow?.is_hook).toBeUndefined();
  });
});
