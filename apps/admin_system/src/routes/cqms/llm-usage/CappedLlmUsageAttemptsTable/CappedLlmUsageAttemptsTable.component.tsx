import type { CappedLlmUsageAttemptRow } from '@repo/scan-ingestion/queries/getCappedLlmUsageAttempts.util';

import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';

import type { CappedLlmUsageAttemptsTableProps } from './CappedLlmUsageAttemptsTable.types';

import { CAPPED_LLM_USAGE_ATTEMPTS_COLUMNS } from './CappedLlmUsageAttemptsTable.constants';

export const CappedLlmUsageAttemptsTable = ({
  cappedAttemptsPromise,
}: CappedLlmUsageAttemptsTableProps) => (
  <TableLayout<CappedLlmUsageAttemptRow, readonly CappedLlmUsageAttemptRow[]>
    columnsState={createEmptyColumnsState({
      columns: CAPPED_LLM_USAGE_ATTEMPTS_COLUMNS,
    })}
    dataPromise={cappedAttemptsPromise}
    dataSelector={(rows) => rows}
    metaState={{ title: { plural: 'Capped Attempts', singular: 'Attempt' } }}
  />
);
