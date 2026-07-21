import type { TableColumn } from '@lcabrera/ui/components/Table';
import type { ScanFindingRow } from '@repo/scan-ingestion/queries/getScanFindings.util';

export const SCAN_FINDINGS_COLUMNS: readonly TableColumn<ScanFindingRow>[] = [
  { dataType: 'string', key: 'severity', label: 'Severity', minWidth: 110 },
  { dataType: 'string', key: 'rule_id', label: 'Rule', minWidth: 160 },
  {
    dataType: 'string',
    key: 'location_path',
    label: 'Location',
    minWidth: 200,
  },
  { dataType: 'string', key: 'why', label: 'Why', minWidth: 240 },
  { dataType: 'string', key: 'fix', label: 'Fix', minWidth: 240 },
];
