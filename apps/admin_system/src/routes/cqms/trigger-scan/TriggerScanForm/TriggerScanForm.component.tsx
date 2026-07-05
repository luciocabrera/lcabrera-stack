import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { use } from 'react';

import type { TriggerScanValues } from '../triggerScan.schema';
import type { TriggerScanFormProps } from './TriggerScanForm.types';

/**
 * Reads `scannersPromise` via `use()` — must be rendered inside a
 * `<Suspense>` boundary by its parent, same contract as
 * `ProjectTrendPanel`. The promise comes from the loader, never created
 * here.
 */
export const TriggerScanForm = ({
  projectId,
  scannersPromise,
  serverErrors,
}: TriggerScanFormProps) => {
  const scanners = use(scannersPromise);

  const fields: readonly FieldNode<TriggerScanValues>[] = [
    {
      accessor: 'scannerIds',
      label: 'Scanners',
      mode: 'multi',
      options: scanners.map((scanner) => ({
        label: scanner.display_name,
        value: scanner.scanner_id,
      })),
      type: 'select',
    },
  ];

  return (
    <Form<TriggerScanValues>
      cancelTo={`/cqms/projects/view/${projectId}`}
      fields={fields}
      initialValues={{ scannerIds: [] }}
      mode='create'
      serverErrors={serverErrors}
      submitLabel='Start Scan'
    />
  );
};
