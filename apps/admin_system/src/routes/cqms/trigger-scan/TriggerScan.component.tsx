import { SectionCard } from '@repo/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './triggerScan.action';
import type { loader } from './triggerScan.loader';

import { ActiveRunNotice } from './ActiveRunNotice';
import { TriggerScanForm } from './TriggerScanForm';

export const TriggerScan = () => {
  const {
    activeRun,
    hasSnapshot,
    projectId,
    scannersPromise,
    workspacesPromise,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

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

  const conflict =
    actionData && 'conflict' in actionData ? actionData.conflict : undefined;
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  // A run that was already active at load, or one that started between load and
  // submit (the action's 409). Either way the form is replaced by the banner.
  const blockingRun = activeRun ?? conflict;

  return (
    <SectionCard
      description='Pick which scanners to run against this project, optionally scoped to specific workspaces.'
      title='Trigger Scan'
    >
      {blockingRun ? (
        <ActiveRunNotice
          elapsed={blockingRun.elapsed}
          projectId={projectId}
          runId={blockingRun.runId}
        />
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
