import { SectionCard } from '@repo/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './triggerScan.action';
import type { loader } from './triggerScan.loader';

import { TriggerScanForm } from './TriggerScanForm';

export const TriggerScan = () => {
  const { projectId, scannersPromise, workspacesPromise } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Pick which scanners to run against this project, optionally scoped to specific workspaces.'
      title='Trigger Scan'
    >
      <Suspense fallback={<p>Loading scanners…</p>}>
        <TriggerScanForm
          projectId={projectId}
          scannersPromise={scannersPromise}
          serverErrors={serverErrors}
          workspacesPromise={workspacesPromise}
        />
      </Suspense>
    </SectionCard>
  );
};
