import type { DailyLlmCostRow } from '@repo/scan-ingestion/queries/getDailyLlmCost.util';

export type DailyLlmCostPanelProps = {
  readonly dailyCostPromise: Promise<readonly DailyLlmCostRow[]>;
};
