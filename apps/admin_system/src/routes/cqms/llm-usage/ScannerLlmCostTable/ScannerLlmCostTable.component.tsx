import type { ScannerLlmCostRow } from '@repo/scan-ingestion/queries/getScannerLlmCost.util';

import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';

import type { ScannerLlmCostTableProps } from './ScannerLlmCostTable.types';

import { SCANNER_LLM_COST_COLUMNS } from './ScannerLlmCostTable.constants';

export const ScannerLlmCostTable = ({
  scannerCostPromise,
}: ScannerLlmCostTableProps) => (
  <TableLayout<ScannerLlmCostRow, readonly ScannerLlmCostRow[]>
    columnsState={createEmptyColumnsState({
      columns: SCANNER_LLM_COST_COLUMNS,
    })}
    dataPromise={scannerCostPromise}
    dataSelector={(rows) => rows}
    metaState={{ title: { plural: 'Scanners', singular: 'Scanner' } }}
  />
);
