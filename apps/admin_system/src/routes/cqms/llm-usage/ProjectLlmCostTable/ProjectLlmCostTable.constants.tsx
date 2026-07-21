import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { ProjectLlmCostRow } from '@repo/scan-ingestion/queries/getProjectLlmCost.util';

import { formatCurrency } from '@lcabrera/utils/formatters/format-currency.util';

export const PROJECT_LLM_COST_COLUMNS: readonly TableColumn<ProjectLlmCostRow>[] =
  [
    {
      dataType: 'string',
      key: 'project_name',
      label: 'Project',
      minWidth: 200,
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
