import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { ScannerListViewRow } from '@repo/scan-ingestion/queries/getScannerListView.util';

import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';

export const SCANNER_LIST_COLUMNS: readonly TableColumn<ScannerListViewRow>[] =
  [
    {
      dataType: 'string',
      isPrimaryKey: true,
      key: 'scanner_id',
      label: 'Scanner Id',
      minWidth: 160,
    },
    {
      dataType: 'string',
      key: 'display_name',
      label: 'Name',
      minWidth: 220,
    },
    {
      key: 'deterministic',
      label: 'Kind',
      minWidth: 130,
      render: (row) => (row.deterministic ? 'Deterministic' : 'LLM agent'),
    },
    { dataType: 'number', key: 'version', label: 'Version', minWidth: 90 },
    {
      key: 'is_active',
      label: 'Active',
      minWidth: 110,
      render: (row) => (
        <StatusBadge
          label={row.is_active ? 'active' : 'inactive'}
          tone={row.is_active ? 'success' : 'neutral'}
        />
      ),
    },
    { dataType: 'date', key: 'edited_at', label: 'Edited', minWidth: 150 },
  ];
