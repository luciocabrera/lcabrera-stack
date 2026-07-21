import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { ScannerLlmCostRow } from '@repo/scan-ingestion/queries/getScannerLlmCost.util';

import { formatCurrency } from '@lcabrera/utils/formatters/format-currency.util';

export const SCANNER_LLM_COST_COLUMNS: readonly TableColumn<ScannerLlmCostRow>[] =
  [
    {
      dataType: 'string',
      key: 'display_name',
      label: 'Scanner',
      minWidth: 180,
    },
    { dataType: 'number', key: 'call_count', label: 'Calls', minWidth: 90 },
    {
      dataType: 'number',
      key: 'capped_count',
      label: 'Capped',
      minWidth: 90,
    },
    {
      key: 'total_cost_usd',
      label: 'Cost',
      minWidth: 120,
      render: (row) => formatCurrency({ value: row.total_cost_usd }),
    },
  ];
