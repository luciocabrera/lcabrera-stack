import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { runSkillAgent } from '@repo/agent-runner';
import { ingestReport } from '@repo/scan-ingestion/ingestion/ingestReport';
import type { QueuedScanRow } from '@repo/scan-ingestion/queries/getQueuedScans.util';
import { markScanFailed } from '@repo/scan-ingestion/queries/markScanFailed.util';
import { markScanRunning } from '@repo/scan-ingestion/queries/markScanRunning.util';
import { updateScanProgress } from '@repo/scan-ingestion/queries/updateScanProgress.util';

import type { RunStatusHub } from '../ws/runStatusHub.ts';

import { cqmsRepoRoot } from '../cqmsRepoRoot.util.ts';

const LINTER_SCRIPT_PATH = join(
  cqmsRepoRoot,
  '.github/skills/linter-checker/scripts/generate-linter-report.mjs',
);

type RunQueuedScanArgs = {
  readonly hub: RunStatusHub;
  readonly scan: QueuedScanRow;
};

const publishStatus = (
  hub: RunStatusHub,
  scan: QueuedScanRow,
  status: string,
): void => {
  hub.publish(scan.run_id, {
    runId: scan.run_id,
    scanId: scan.scan_id,
    scannerId: scan.scanner_id,
    status,
    type: 'scan-status',
  });
};

const runDeterministicLinter = async (
  scan: QueuedScanRow,
  outputDirectory: string,
): Promise<'failed' | 'succeeded'> => {
  try {
    execFileSync(
      'node',
      [
        LINTER_SCRIPT_PATH,
        `--target=${scan.local_path}`,
        `--scope=${scan.scope_value || '.'}`,
        `--output-dir=${outputDirectory}`,
        '--skip-ingest',
      ],
      { encoding: 'utf8' },
    );
  } catch (error) {
    // Real execution failures already degrade to a report.json noting the
    // failure (the script's own resilience, ADR-015) — this catch only
    // covers the script itself failing to even start.
    console.error(`❌ linter-checker script failed to run:`, error);
  }

  const reportMarkdownPath = join(outputDirectory, 'report.md');
  const reportJsonPath = join(outputDirectory, 'report.json');

  if (!existsSync(reportMarkdownPath) || !existsSync(reportJsonPath)) {
    await markScanFailed({
      errorMessage: 'linter-checker script did not produce report files.',
      runId: scan.run_id,
      scanId: scan.scan_id,
    });
    return 'failed';
  }

  const rawJsonPath = join(outputDirectory, 'linter.raw.json');

  await ingestReport({
    localPath: scan.local_path,
    origin: 'ui_agent_sdk',
    rawJsonPath: existsSync(rawJsonPath) ? rawJsonPath : undefined,
    reportJsonPath,
    reportMarkdownPath,
    runId: scan.run_id,
    scannerId: 'linter',
    scopeType: scan.scope_type as 'changed-files' | 'diff' | 'folder' | 'repo',
    scopeValue: scan.scope_value,
  });
  return 'succeeded';
};

const runAgentSkill = async (
  scan: QueuedScanRow,
  outputDirectory: string,
  hub: RunStatusHub,
): Promise<'failed' | 'succeeded'> => {
  const result = await runSkillAgent({
    onProgress: (message) => {
      updateScanProgress({
        progressMessage: message,
        scanId: scan.scan_id,
      }).catch((error: unknown) => {
        console.error('❌ Failed to persist scan progress:', error);
      });
      hub.publish(scan.run_id, {
        runId: scan.run_id,
        scanId: scan.scan_id,
        scannerId: scan.scanner_id,
        status: message,
        type: 'scan-progress',
      });
    },
    outputDirectory,
    scannerId: scan.scanner_id as
      | 'code-smell-checker'
      | 'code-smell-zen'
      | 'fallow',
    scopeArgument: scan.scope_value === '.' ? undefined : scan.scope_value,
    skillPath: scan.skill_path,
    targetProjectPath: scan.local_path,
  });

  if (!result.success || !result.reportMarkdownPath || !result.reportJsonPath) {
    await markScanFailed({
      errorMessage:
        result.errorMessage ?? 'Agent session did not produce a report.',
      runId: scan.run_id,
      scanId: scan.scan_id,
    });
    return 'failed';
  }

  // Only fallow's skill produces a raw artifact today (TECH_SPEC §2.4).
  const rawJsonPath = join(outputDirectory, 'fallow.raw.json');

  await ingestReport({
    localPath: scan.local_path,
    origin: 'ui_agent_sdk',
    rawJsonPath:
      scan.scanner_id === 'fallow' && existsSync(rawJsonPath)
        ? rawJsonPath
        : undefined,
    reportJsonPath: result.reportJsonPath,
    reportMarkdownPath: result.reportMarkdownPath,
    runId: scan.run_id,
    scannerId: scan.scanner_id as
      | 'code-smell-checker'
      | 'code-smell-zen'
      | 'fallow',
    scopeType: scan.scope_type as 'changed-files' | 'diff' | 'folder' | 'repo',
    scopeValue: scan.scope_value,
  });
  return 'succeeded';
};

/**
 * Executes one queued scan end to end (TECH_SPEC §2.7): marks it running,
 * branches per scanners.deterministic exactly as originally planned
 * (§2.5) — linter via a plain child process, the other three via
 * @repo/agent-runner — then ingests the result or marks the scan failed.
 * Any unexpected error here is caught and turned into a failed scan
 * rather than crashing the whole orchestrator process; one bad scan must
 * not take down the queue for every other project.
 */
export const runQueuedScan = async ({
  hub,
  scan,
}: RunQueuedScanArgs): Promise<void> => {
  await markScanRunning({ scanId: scan.scan_id });
  publishStatus(hub, scan, 'running');

  const outputDirectory = join(
    cqmsRepoRoot,
    '.tmp',
    'scan-orchestrator',
    scan.scan_id,
  );
  mkdirSync(outputDirectory, { recursive: true });

  let finalStatus: 'failed' | 'succeeded';
  try {
    finalStatus = scan.deterministic
      ? await runDeterministicLinter(scan, outputDirectory)
      : await runAgentSkill(scan, outputDirectory, hub);
  } catch (error) {
    console.error(`❌ Scan ${scan.scan_id} failed unexpectedly:`, error);
    await markScanFailed({
      errorMessage: error instanceof Error ? error.message : String(error),
      runId: scan.run_id,
      scanId: scan.scan_id,
    });
    finalStatus = 'failed';
  }

  publishStatus(hub, scan, finalStatus);
};
