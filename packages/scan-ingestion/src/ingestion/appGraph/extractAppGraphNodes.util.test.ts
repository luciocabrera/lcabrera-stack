import { describe, expect, it } from 'vitest';

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

  it('drops nodes without a node_id and coerces unknown node types to file', () => {
    const raw = appGraphRawSchema.parse({
      nodes: [
        { name: 'ghost.ts', node_type: 'file', path: 'ghost.ts' },
        {
          name: 'weird.ts',
          node_id: 7,
          node_type: 'symlink',
          path: 'weird.ts',
        },
      ],
    });

    const rows = extractAppGraphNodes({ raw });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.node_id).toBe(7);
    expect(rows[0]?.node_type).toBe('file');
    expect(rows[0]?.file_type_category).toBe('other');
  });
});
