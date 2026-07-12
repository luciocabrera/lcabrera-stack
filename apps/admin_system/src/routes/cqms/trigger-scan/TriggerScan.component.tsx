import { SectionCard } from '@repo/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './triggerScan.action';
import type { loader } from './triggerScan.loader';

import { TriggerScanForm } from './TriggerScanForm';

export const TriggerScan = () => {
  const {
    hasActiveRun,
    hasSnapshot,
    projectId,
    scannersPromise,
    workspacesPromise,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  if (!hasSnapshot) {
    return (
      <SectionCard
        description='Scans always run against the latest synced snapshot.'
        title='Trigger Scan'
      >
        <p>
          No code snapshot has been synced for this project — upload one from
          the project page first.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      description='Pick which scanners to run against this project, optionally scoped to specific workspaces.'
      title='Trigger Scan'
    >
      {hasActiveRun ? (
        <p>
          A scan is already running for this project — wait for it to finish
          before starting another.
        </p>
      ) : (
        <Suspense fallback={<p>Loading scanners…</p>}>
          <TriggerScanForm
            projectId={projectId}
            scannersPromise={scannersPromise}
            serverErrors={serverErrors}
            workspacesPromise={workspacesPromise}
          />
        </Suspense>
      )}
    </SectionCard>
  );
};
