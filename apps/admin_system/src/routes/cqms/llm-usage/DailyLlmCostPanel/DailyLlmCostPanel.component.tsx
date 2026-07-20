import { TrendSparkline } from '@repo/ui/components/TrendSparkline';
import { formatCurrency } from '@repo/utils/formatters/format-currency.util';
import { use } from 'react';

import type { DailyLlmCostPanelProps } from './DailyLlmCostPanel.types';

/**
 * Cost (USD) and capped-attempt count are two different-scale measures —
 * kept as two separate stat numbers rather than one dual-axis chart (never
 * combine two measures of different scale on one chart). The sparkline
 * shows only the cost series' shape over time, matching the tone-based
 * single-hue usage this component already has elsewhere in the app.
 */
export const DailyLlmCostPanel = ({
  dailyCostPromise,
}: DailyLlmCostPanelProps) => {
  const rows = use(dailyCostPromise);

  if (rows.length === 0) {
    return <p>No LLM usage recorded yet.</p>;
  }

  const totalCostUsd = rows.reduce((sum, row) => sum + row.total_cost_usd, 0);
  const totalCappedCount = rows.reduce((sum, row) => sum + row.capped_count, 0);

  return (
    <div>
      <p>
        Total cost: <strong>{formatCurrency({ value: totalCostUsd })}</strong>
      </p>
      <p>
        Capped attempts: <strong>{totalCappedCount}</strong>
      </p>
      <TrendSparkline
        label='Total LLM cost per day'
        tone='info'
        values={rows.map((row) => row.total_cost_usd)}
      />
    </div>
  );
};
