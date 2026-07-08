import { getPool } from '@repo/data-access/db/getPool.util';
import { buildSelectQuery } from '@repo/data-access/db/queryBuilder/buildSelectQuery.util';

export type DailyLlmCostRow = {
  readonly call_count: number;
  readonly capped_count: number;
  readonly total_cost_usd: number;
  readonly usage_date: Date;
};

type DailyLlmCostDbRow = {
  readonly call_count: number;
  readonly capped_count: number;
  readonly total_cost_usd: string;
  readonly usage_date: Date;
};

const FIELDS = [
  'usage_date',
  'call_count',
  'capped_count',
  'total_cost_usd',
] as const;

/** Org-wide cost/call counts grouped by day — backs the llm-usage report's daily trend panel. */
export const getDailyLlmCost = async (): Promise<
  readonly DailyLlmCostRow[]
> => {
  const { text, values } = buildSelectQuery({
    fields: FIELDS,
    schema: 'llm_usage',
    sort: [{ column: 'usage_date', direction: 'asc' }],
    table: 'v_daily_llm_cost',
  });

  const result = await getPool().query<DailyLlmCostDbRow>(text, [...values]);

  // pg returns `numeric` columns as strings, not JS numbers.
  return result.rows.map((row) => ({
    ...row,
    total_cost_usd: Number(row.total_cost_usd),
  }));
};
