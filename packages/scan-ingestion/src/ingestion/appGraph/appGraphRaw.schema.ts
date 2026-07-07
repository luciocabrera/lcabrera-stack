import { z } from 'zod';

/**
 * Loose parse of app-graph.raw.json (`{ kind: 'app-graph', nodes: [...] }`,
 * ADR-022). Every field is defaulted/nullish so a future runner version's
 * shape drift degrades to partial extraction instead of throwing — detail
 * extraction must never flip an already-succeeded scan to failed (ADR-019).
 * node_id is nullish rather than required for the same reason: a node that
 * lost its id is dropped by the extractor, not fatal to the whole scan.
 */
export const appGraphRawNodeSchema = z.object({
  child_file_count: z.number().int().default(0),
  child_folder_count: z.number().int().default(0),
  export_count: z.number().int().default(0),
  extension: z.string().default(''),
  function_count: z.number().int().default(0),
  is_analyzed: z.boolean().default(false),
  line_count: z.number().int().nullish(),
  name: z.string().default(''),
  nested_level: z.number().int().default(0),
  node_id: z.number().int().nullish(),
  node_type: z.string().default('file'),
  parent_node_id: z.number().int().nullish(),
  path: z.string().default(''),
  type_count: z.number().int().default(0),
});

export const appGraphRawSchema = z.object({
  kind: z.string().nullish(),
  nodes: z.array(appGraphRawNodeSchema).default([]),
  stats: z.record(z.string(), z.unknown()).nullish(),
});

export type AppGraphRaw = z.infer<typeof appGraphRawSchema>;
export type AppGraphRawNode = z.infer<typeof appGraphRawNodeSchema>;
