import { z } from 'zod';

/**
 * Loose parse of app-graph.raw.json (`{ kind: 'app-graph', nodes: [...] }`,
 * ADR-022, symbol nodes added by ADR-027). Every field is defaulted/nullish
 * so a future runner version's shape drift degrades to partial extraction
 * instead of throwing — detail extraction must never flip an
 * already-succeeded scan to failed (ADR-019). node_id is nullish rather
 * than required for the same reason: a node that lost its id is dropped by
 * the extractor, not fatal to the whole scan. The ADR-027 symbol fields
 * (symbol_name/is_exported/is_component/is_hook/start_line/end_line) are
 * all nullish — meaningless for folder/file rows and only ever populated by
 * the runner for the new function/method/class/interface/type_alias/enum
 * node types.
 */
export const appGraphRawNodeSchema = z.object({
  child_file_count: z.number().int().default(0),
  child_folder_count: z.number().int().default(0),
  end_line: z.number().int().nullish(),
  export_count: z.number().int().default(0),
  extension: z.string().default(''),
  function_count: z.number().int().default(0),
  is_analyzed: z.boolean().default(false),
  is_component: z.boolean().nullish(),
  is_exported: z.boolean().nullish(),
  is_hook: z.boolean().nullish(),
  line_count: z.number().int().nullish(),
  name: z.string().default(''),
  nested_level: z.number().int().default(0),
  node_id: z.number().int().nullish(),
  node_type: z.string().default('file'),
  parent_node_id: z.number().int().nullish(),
  path: z.string().default(''),
  start_line: z.number().int().nullish(),
  symbol_name: z.string().nullish(),
  type_count: z.number().int().default(0),
});

export const appGraphRawSchema = z.object({
  kind: z.string().nullish(),
  nodes: z.array(appGraphRawNodeSchema).default([]),
  stats: z.record(z.string(), z.unknown()).nullish(),
});

export type AppGraphRaw = z.infer<typeof appGraphRawSchema>;
export type AppGraphRawNode = z.infer<typeof appGraphRawNodeSchema>;
