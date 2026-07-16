import { selectLlmCostRows } from './selectLlmCostRows.util.ts';

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
export const getDailyLlmCost = async (): Promise<readonly DailyLlmCostRow[]> =>
  await selectLlmCostRows<DailyLlmCostDbRow>({
    fields: FIELDS,
    sort: [{ column: 'usage_date', direction: 'asc' }],
    table: 'v_daily_llm_cost',
  });
