import { Suspense } from 'react';
import { useLoaderData } from 'react-router';

import type { loader } from './llmUsage.loader';

import { CappedLlmUsageAttemptsTable } from './CappedLlmUsageAttemptsTable';
import { DailyLlmCostPanel } from './DailyLlmCostPanel';
import { ProjectLlmCostTable } from './ProjectLlmCostTable';
import { ScannerLlmCostTable } from './ScannerLlmCostTable';

export const LlmUsage = () => {
  const {
    cappedAttemptsPromise,
    dailyCostPromise,
    projectCostPromise,
    scannerCostPromise,
  } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>LLM Usage</h1>

      <Suspense fallback={<p>Loading daily cost…</p>}>
        <DailyLlmCostPanel dailyCostPromise={dailyCostPromise} />
      </Suspense>

      <h2>Cost by Scanner</h2>
      <ScannerLlmCostTable scannerCostPromise={scannerCostPromise} />

      <h2>Cost by Project</h2>
      <ProjectLlmCostTable projectCostPromise={projectCostPromise} />

      <h2>Capped Attempts</h2>
      <CappedLlmUsageAttemptsTable
        cappedAttemptsPromise={cappedAttemptsPromise}
      />
    </div>
  );
};
