import { selectLlmCostRows } from './selectLlmCostRows.util.ts';

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
> =>
  await selectLlmCostRows<ProjectLlmCostDbRow>({
    fields: FIELDS,
    sort: [{ column: 'total_cost_usd', direction: 'desc' }],
    table: 'v_project_llm_cost',
  });
