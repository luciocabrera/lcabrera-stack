import type { CappedLlmUsageAttemptRow } from '@repo/scan-ingestion/queries/getCappedLlmUsageAttempts.util';
import type { TableColumn } from '@repo/ui/components/Table';

import { formatDate } from '@repo/ui/utils/formatters/formatDate.util';

export const CAPPED_LLM_USAGE_ATTEMPTS_COLUMNS: readonly TableColumn<CappedLlmUsageAttemptRow>[] =
  [
    {
      dataType: 'string',
      key: 'project_name',
      label: 'Project',
      minWidth: 180,
    },
    {
      dataType: 'string',
      key: 'scanner_display_name',
      label: 'Scanner',
      minWidth: 160,
    },
    {
      dataType: 'string',
      key: 'triggered_by',
      label: 'Triggered by',
      minWidth: 140,
    },
    {
      dataType: 'string',
      key: 'error_message',
      label: 'Reason',
      minWidth: 280,
    },
    {
      key: 'created_at',
      label: 'When',
      minWidth: 160,
      render: (row) => formatDate({ preset: 'medium', value: row.created_at }),
    },
  ];
