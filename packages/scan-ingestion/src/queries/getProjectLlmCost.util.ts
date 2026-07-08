import { getPool } from '@repo/data-access/db/getPool.util';
import { buildSelectQuery } from '@repo/data-access/db/queryBuilder/buildSelectQuery.util';

export type ProjectLlmCostRow = {
  readonly call_count: number;
  readonly capped_count: number;
  readonly project_id: string;
  readonly project_name: string;
  readonly total_cost_usd: number;
};

type ProjectLlmCostDbRow = {
  readonly call_count: number;
  readonly capped_count: number;
  readonly project_id: string;
  readonly project_name: string;
  readonly total_cost_usd: string;
};

const FIELDS = [
  'project_id',
  'project_name',
  'call_count',
  'capped_count',
  'total_cost_usd',
] as const;

/** Org-wide cost/call counts grouped by project — backs the llm-usage report's per-project panel. */
export const getProjectLlmCost = async (): Promise<
  readonly ProjectLlmCostRow[]
> => {
  const { text, values } = buildSelectQuery({
    fields: FIELDS,
    schema: 'llm_usage',
    sort: [{ column: 'total_cost_usd', direction: 'desc' }],
    table: 'v_project_llm_cost',
  });

  const result = await getPool().query<ProjectLlmCostDbRow>(text, [...values]);

  return result.rows.map((row) => ({
    ...row,
    total_cost_usd: Number(row.total_cost_usd),
  }));
};
