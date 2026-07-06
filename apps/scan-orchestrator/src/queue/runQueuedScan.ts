import type { QueuedScanRow } from '@repo/scan-ingestion/queries/getQueuedScans.util';

import { runSkillAgent } from '@repo/agent-runner';
import { ingestReport } from '@repo/scan-ingestion/ingestion/ingestReport';
import { markScanFailed } from '@repo/scan-ingestion/queries/markScanFailed.util';
import { markScanRunning } from '@repo/scan-ingestion/queries/markScanRunning.util';
import { updateScanProgress } from '@repo/scan-ingestion/queries/updateScanProgress.util';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

import type { RunStatusHub } from '../ws/runStatusHub.ts';

import { cqmsRepoRoot } from '../cqmsRepoRoot.util.ts';
import {
  createScanOutputDirectory,
  getScanOutputPathIfExists,
} from './scanOutputPaths.util.ts';

const LINTER_SCRIPT_PATH = path.join(
  cqmsRepoRoot,
  '.github/skills/linter-checker/scripts/generate-linter-report.mjs',
);

type PublishStatusArgs = {
  readonly hub: RunStatusHub;
  readonly scan: QueuedScanRow;
  readonly status: string;
};

const publishStatus = ({ hub, scan, status }: PublishStatusArgs): void => {
  hub.publish({
    payload: {
      runId: scan.run_id,
      scanId: scan.scan_id,
      scannerId: scan.scanner_id,
      status,
      type: 'scan-status',
    },
    runId: scan.run_id,
  });
};

type PersistScanProgressArgs = {
  readonly progressMessage: string;
  readonly scanId: string;
  readonly userId: string;
};

const persistScanProgress = async ({
  progressMessage,
  scanId,
  userId,
}: PersistScanProgressArgs): Promise<void> => {
  try {
    await updateScanProgress({ progressMessage, scanId, userId });
  } catch (error) {
    console.error('❌ Failed to persist scan progress:', error);
  }
};

type RunDeterministicLinterArgs = {
  readonly outputDirectory: string;
  readonly scan: QueuedScanRow;
  readonly userId: string;
};

const runDeterministicLinter = async ({
  outputDirectory,
  scan,
  userId,
}: RunDeterministicLinterArgs): Promise<'failed' | 'succeeded'> => {
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

  const reportMarkdownPath = getScanOutputPathIfExists({
    fileName: 'report.md',
    scanId: scan.scan_id,
  });
  const reportJsonPath = getScanOutputPathIfExists({
    fileName: 'report.json',
    scanId: scan.scan_id,
  });

  if (!reportMarkdownPath || !reportJsonPath) {
    await markScanFailed({
      errorMessage: 'linter-checker script did not produce report files.',
      runId: scan.run_id,
      scanId: scan.scan_id,
      userId,
    });
    return 'failed';
  }

  await ingestReport({
    localPath: scan.local_path,
    origin: 'ui_agent_sdk',
    rawJsonPath: getScanOutputPathIfExists({
      fileName: 'linter.raw.json',
      scanId: scan.scan_id,
    }),
    reportJsonPath,
    reportMarkdownPath,
    runId: scan.run_id,
    scannerId: 'linter',
    scopeType: scan.scope_type as 'changed-files' | 'diff' | 'folder' | 'repo',
    scopeValue: scan.scope_value,
    userId,
  });
  return 'succeeded';
};

type RunAgentSkillArgs = {
  readonly hub: RunStatusHub;
  readonly outputDirectory: string;
  readonly scan: QueuedScanRow;
  readonly userId: string;
};

const runAgentSkill = async ({
  hub,
  outputDirectory,
  scan,
  userId,
}: RunAgentSkillArgs): Promise<'failed' | 'succeeded'> => {
  const result = await runSkillAgent({
    onProgress: (message) => {
      void persistScanProgress({
        progressMessage: message,
        scanId: scan.scan_id,
        userId,
      });
      hub.publish({
        payload: {
          runId: scan.run_id,
          scanId: scan.scan_id,
          scannerId: scan.scanner_id,
          status: message,
          type: 'scan-progress',
        },
        runId: scan.run_id,
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
      userId,
    });
    return 'failed';
  }

  await ingestReport({
    localPath: scan.local_path,
    origin: 'ui_agent_sdk',
    // Only fallow's skill produces a raw artifact today (TECH_SPEC §2.4).
    rawJsonPath:
      scan.scanner_id === 'fallow'
        ? getScanOutputPathIfExists({
            fileName: 'fallow.raw.json',
            scanId: scan.scan_id,
          })
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
    userId,
  });
  return 'succeeded';
};

type RunQueuedScanArgs = {
  readonly hub: RunStatusHub;
  readonly scan: QueuedScanRow;
  readonly userId: string;
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
  userId,
}: RunQueuedScanArgs): Promise<void> => {
  await markScanRunning({ scanId: scan.scan_id, userId });
  publishStatus({ hub, scan, status: 'running' });

  const outputDirectory = createScanOutputDirectory({ scanId: scan.scan_id });

  let finalStatus: 'failed' | 'succeeded';
  try {
    finalStatus = scan.deterministic
      ? await runDeterministicLinter({ outputDirectory, scan, userId })
      : await runAgentSkill({ hub, outputDirectory, scan, userId });
  } catch (error) {
    console.error(`❌ Scan ${scan.scan_id} failed unexpectedly:`, error);
    await markScanFailed({
      errorMessage: error instanceof Error ? error.message : String(error),
      runId: scan.run_id,
      scanId: scan.scan_id,
      userId,
    });
    finalStatus = 'failed';
  }

  publishStatus({ hub, scan, status: finalStatus });
};
