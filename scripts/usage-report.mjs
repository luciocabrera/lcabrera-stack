/**
 * Reports how this repository's harness is actually used, so "is this skill,
 * subagent or workflow still earning its place" is a lookup rather than an
 * argument.
 *
 * It reads stores that already retain history — Claude Code transcripts, the
 * GitHub Actions run history, git over the requirement and coordination
 * registers — and adds no collector of its own; a local gitignored snapshot
 * carries the days the transcripts expire. Path rules get no number, because
 * nothing invokes one and the only proxy reads the same whether a rule is
 * internalised or dead. Produced on demand and never committed (ADR-049): no
 * count it prints may be copied into a tracked file — name this command.
 *
 * Usage (from the repo root):
 *   vp run usage:report
 *   vp run usage:report -- --days 30
 *   vp run usage:report -- --transcript-retention-days 1   # simulate expiry
 *   vp run usage:report -- --now 2026-09-01T00:00:00Z --out reports/usage
 *
 * Exit codes: 0 = a report was written, including when a source could not be
 * read (it is reported as unread, never as a count of zero); 1 = bad arguments,
 * an unusable `cleanupPeriodDays`, or the report could not be written.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';
import { runGh } from './lib/gh-exec.mjs';
import {
  parseArgs,
  positiveInteger,
  resolveRetention,
  transcriptHorizon,
} from './lib/usage-args.mjs';
import { readHarnessInventory } from './lib/usage-inventory.mjs';
import { renderReport } from './lib/usage-render.mjs';
import { repositoryWorkingTrees } from './lib/usage-scope.mjs';
import {
  countsFor,
  earliestDay,
  mergeTally,
  readSnapshot,
  writeSnapshot,
} from './lib/usage-snapshot.mjs';
import {
  isShallowClone,
  readRegisterActivity,
  readWorkflowRuns,
} from './lib/usage-sources.mjs';
import {
  readTranscriptUsage,
  transcriptsRoot,
} from './lib/usage-transcripts.mjs';
import { windowOf } from './lib/usage-window.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const COMMAND = 'vp run usage:report';
const DEFAULT_WINDOW_DAYS = 90;

const relativeToRepo = (path) => path.replace(`${REPO_ROOT}/`, '');

const invocationRowsFor = ({ inventory, kind, live, merged, window }) =>
  [...new Set([...inventory, ...Object.keys(merged[kind])])]
    .toSorted((a, b) => a.localeCompare(b))
    .map((name) => ({
      inInventory: inventory.includes(name),
      name,
      window,
      ...countsFor({
        live: live[kind] ?? {},
        merged: merged[kind],
        name,
        window,
      }),
    }));

const workflowSection = ({ inventory, window }) => {
  const read = readWorkflowRuns({ runGh, window, workflows: inventory });
  return {
    ...read,
    rows: inventory.map((file) => ({
      file,
      window,
      ...read.runs[file],
    })),
  };
};

const registerSection = ({ detail, directory, heading, note, window }) => ({
  detail,
  directory,
  heading,
  note,
  window,
  ...readRegisterActivity({ cwd: REPO_ROOT, directory, runGit, window }),
});

const REGISTERS = [
  {
    detail: 'per-file',
    directory: 'docs/product/requirements',
    heading: 'Product requirement register',
    note: 'A requirement is a durable artifact, so this register is reported one row per file.',
  },
  {
    detail: 'summary',
    directory: 'docs/coordination/tasks',
    heading: 'Coordination register',
    note: 'A task file exists for the life of one claim and is deleted when it merges, so what this register can show is its throughput, not the history of any one file.',
  },
];

const setAsideNotice = (setAside) =>
  setAside === undefined
    ? undefined
    : { movedTo: relativeToRepo(setAside.movedTo), reason: setAside.reason };

const buildReport = ({
  args,
  generatedAt,
  inventory,
  snapshotPath,
  window,
}) => {
  const retention = resolveRetention({
    args,
    repoRoot: REPO_ROOT,
    userHome: homedir(),
  });
  const readFrom = transcriptHorizon({ retention, window });
  const workingTrees = repositoryWorkingTrees(REPO_ROOT);
  const live = readTranscriptUsage({
    root: transcriptsRoot(),
    since: readFrom,
    workingTrees,
  });
  const stored = readSnapshot({ path: snapshotPath, timestamp: generatedAt });
  const merged = mergeTally(stored.days, live.tally);
  writeSnapshot({ days: merged, path: snapshotPath, updatedAt: generatedAt });

  const transcripts = {
    ...live,
    readFrom,
    retentionDays: retention.days,
    retentionDeclaredIn:
      retention.declaredIn === undefined
        ? undefined
        : relativeToRepo(retention.declaredIn),
    simulatedHorizon: retention.simulated,
    snapshot: {
      earliestDay: earliestDay(merged),
      path: relativeToRepo(snapshotPath),
      setAside: setAsideNotice(stored.setAside),
    },
    workingTrees,
  };
  return {
    command: COMMAND,
    generatedAt,
    pathRules: inventory.pathRules,
    registers: REGISTERS.map((register) =>
      registerSection({ ...register, window }),
    ),
    shallowClone: isShallowClone({ cwd: REPO_ROOT, runGit }),
    skills: invocationRowsFor({
      inventory: inventory.skills,
      kind: 'skills',
      live: live.tally,
      merged,
      window,
    }),
    subagents: invocationRowsFor({
      inventory: inventory.subagents,
      kind: 'subagents',
      live: live.tally,
      merged,
      window,
    }),
    transcripts,
    window,
    workflows: workflowSection({ inventory: inventory.workflows, window }),
  };
};

const writeOutputs = ({ outDir, report }) => {
  mkdirSync(outDir, { recursive: true });
  const markdownPath = join(outDir, 'harness-usage.md');
  const jsonPath = join(outDir, 'harness-usage.json');
  writeFileSync(markdownPath, renderReport(report));
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  return { jsonPath, markdownPath };
};

const statusOf = ({ available, reason }) =>
  available ? 'read' : `NOT READ — ${reason}`;

const printWarnings = (report) => {
  const { setAside } = report.transcripts.snapshot;
  if (setAside !== undefined) {
    console.warn(
      `  warning: the previous snapshot could not be read (${setAside.reason}), so it was moved to ${setAside.movedTo} rather than overwritten, and this run starts a new one.`,
    );
  }
  if (report.shallowClone) {
    console.warn(
      '  warning: this is a shallow clone, so the git-sourced numbers are bounded by the fetched history.',
    );
  }
};

const printSummary = ({ paths, report }) => {
  console.log(
    `Harness usage — window ${report.window.start} → ${report.window.end}`,
  );
  console.log(`  transcripts: ${statusOf(report.transcripts)}`);
  console.log(`  workflow runs: ${statusOf(report.workflows)}`);
  for (const register of report.registers) {
    console.log(`  ${register.directory}: ${statusOf(register)}`);
  }
  printWarnings(report);
  console.log(`  wrote ${relativeToRepo(paths.markdownPath)}`);
  console.log(`  wrote ${relativeToRepo(paths.jsonPath)}`);
  console.log(`  snapshot ${report.transcripts.snapshot.path}`);
  console.log(
    'Every number in the report is reproduced by re-running this command; do not copy one into a tracked file.',
  );
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = args.now ?? new Date().toISOString();
  const window = windowOf({
    days:
      args.days === undefined
        ? DEFAULT_WINDOW_DAYS
        : positiveInteger(args.days, '--days'),
    now: generatedAt,
  });
  const outDir = resolve(REPO_ROOT, args.out ?? 'reports/usage');
  const snapshotPath = resolve(
    REPO_ROOT,
    args.snapshot ?? join(outDir, 'snapshot.json'),
  );
  const report = buildReport({
    args,
    generatedAt,
    inventory: readHarnessInventory(REPO_ROOT),
    snapshotPath,
    window,
  });
  printSummary({ paths: writeOutputs({ outDir, report }), report });
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
