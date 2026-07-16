import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { use } from 'react';

import type { TriggerScanValues } from '../triggerScan.schema';
import type { TriggerScanFormProps } from './TriggerScanForm.types';

/**
 * Reads `scannersPromise`/`workspacesPromise` via `use()` — must be
 * rendered inside a `<Suspense>` boundary by its parent, same contract as
 * `ProjectTrendPanel`. The promises come from the loader, never created
 * here. The workspace multi-select only renders for monorepo projects
 * (discovery found workspaces, ADR-021); leaving it empty scans the whole
 * repo.
 */
export const TriggerScanForm = ({
  projectId,
  scannersPromise,
  serverErrors,
  workspacesPromise,
}: TriggerScanFormProps) => {
  const scanners = use(scannersPromise);
  const workspaces = use(workspacesPromise);

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
    ...(workspaces.length > 0
      ? ([
          {
            accessor: 'workspacePaths',
            label: 'Workspaces (leave empty to scan the whole repo)',
            mode: 'multi',
            options: workspaces.map((workspace) => ({
              label: workspace.workspace_name
                ? `${workspace.workspace_path} — ${workspace.workspace_name}`
                : workspace.workspace_path,
              value: workspace.workspace_path,
            })),
            type: 'select',
          },
        ] satisfies readonly FieldNode<TriggerScanValues>[])
      : []),
    // Only rendered once the action has actually rejected an over-threshold
    // submission — a normal-sized selection never shows this field at all.
    ...(serverErrors?.confirmFanOut
      ? ([
          {
            accessor: 'confirmFanOut',
            description: serverErrors.confirmFanOut,
            label: 'I understand — queue these scans anyway',
            type: 'boolean',
          },
        ] satisfies readonly FieldNode<TriggerScanValues>[])
      : []),
  ];

  return (
    <Form<TriggerScanValues>
      cancelTo={`/cqms/projects/view/${projectId}`}
      fields={fields}
      initialValues={{
        confirmFanOut: false,
        scannerIds: [],
        workspacePaths: [],
      }}
      mode='create'
      serverErrors={serverErrors}
      submitLabel='Start Scan'
    />
  );
};
