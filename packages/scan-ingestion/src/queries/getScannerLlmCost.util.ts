import { getPool } from '@repo/data-access/db/getPool.util';
import { buildSelectQuery } from '@repo/data-access/db/queryBuilder/buildSelectQuery.util';

export type ScannerLlmCostRow = {
  readonly call_count: number;
  readonly capped_count: number;
  readonly display_name: string;
  readonly scanner_id: string;
  readonly total_cost_usd: number;
};

type ScannerLlmCostDbRow = {
  readonly call_count: number;
  readonly capped_count: number;
  readonly display_name: string;
  readonly scanner_id: string;
  readonly total_cost_usd: string;
};

const FIELDS = [
  'scanner_id',
  'display_name',
  'call_count',
  'capped_count',
  'total_cost_usd',
] as const;

/** Org-wide cost/call counts grouped by scanner — backs the llm-usage report's per-scanner panel. */
export const getScannerLlmCost = async (): Promise<
  readonly ScannerLlmCostRow[]
> => {
  const { text, values } = buildSelectQuery({
    fields: FIELDS,
    schema: 'llm_usage',
    sort: [{ column: 'total_cost_usd', direction: 'desc' }],
    table: 'v_scanner_llm_cost',
  });

  const result = await getPool().query<ScannerLlmCostDbRow>(text, [...values]);

  return result.rows.map((row) => ({
    ...row,
    total_cost_usd: Number(row.total_cost_usd),
  }));
};
