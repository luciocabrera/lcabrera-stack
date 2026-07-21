import { MarkdownRenderer } from '@lcabrera/ui/components/MarkdownRenderer';
import { use } from 'react';

import type { ScanReportPanelProps } from './ScanReportPanel.types';

/**
 * Reads `reportPromise` via `use()` — must be rendered inside a
 * `<Suspense>` boundary by its parent, same contract as
 * `ProjectTrendPanel`/`TriggerScanForm`.
 */
export const ScanReportPanel = ({ reportPromise }: ScanReportPanelProps) => {
  const report = use(reportPromise);

  if (!report) {
    return <p>No report available.</p>;
  }

  return <MarkdownRenderer content={report.report_markdown} />;
};
