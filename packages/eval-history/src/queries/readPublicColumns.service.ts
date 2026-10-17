import { z } from 'zod';

import type { QueryClient } from './queries.types.ts';

import { publicColumns } from './publicColumns.util.ts';
import { EVALS_BASE_COLUMNS_SQL } from './queries.constants.ts';

type ReadSchemaColumnsArgs = {
  readonly client: QueryClient;
};

const schemaColumnRowsSchema = z.array(
  z.object({
    column: z.string(),
    dataType: z.string(),
    table: z.string(),
    udtName: z.string(),
  }),
);

export const readSchemaColumns = async ({ client }: ReadSchemaColumnsArgs) => {
  const { rows } = await client.query({
    text: EVALS_BASE_COLUMNS_SQL,
    values: [],
  });

  return schemaColumnRowsSchema.parse(rows);
};

export const readPublicColumns = async (args: ReadSchemaColumnsArgs) =>
  publicColumns(await readSchemaColumns(args));
