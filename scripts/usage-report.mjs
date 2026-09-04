/**
 * Reports how this repository's harness is actually used, so "is this skill,
 * subagent or workflow still earning its place" is a lookup rather than an
 * argument.
 *
 * It reads four stores that already retain history — Claude Code transcripts on
 * this machine, GitHub Actions run history, and git history over the requirement
 * and coordination registers — and adds no collector of its own. One of them
 * expires, so a local gitignored snapshot carries the days the transcripts drop.
 *
 * Path rules are excluded on purpose. A path rule is auto-loaded by glob and
 * nothing invokes it, so there is no invocation to count; the only proxy, the
 * violation rate of the gate behind the rule, reads identically whether the rule
 * is perfectly internalised or completely dead. Those are opposite conclusions
 * from the same data, so the report lists the rules as unmeasurable and gives
 * them no number.
 *
 * The report is produced on demand and never committed (ADR-049), and no count
 * it prints may be copied into a tracked file — name this command instead.
 *
 * Usage (from the repo root):
 *   vp run usage:report
 *   vp run usage:report -- --days 30
 *   vp run usage:report -- --transcript-retention-days 1   # simulate expiry
 *   vp run usage:report -- --now 2026-09-01T00:00:00Z --out reports/usage
 *
 * Exit codes: 0 = a report was written, including when a source could not be
 * read (it is reported as unread, never as a count of zero); 1 = bad arguments
 * or the report could not be written.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runGit } from '../packages/repo-standards/scripts/git-exec.mjs';
import { runGh } from './lib/gh-exec.mjs';
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
import { shiftDay, windowOf } from './lib/usage-window.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const COMMAND = 'vp run usage:report';
const DEFAULT_WINDOW_DAYS = 90;
const DOCUMENTED_CLEANUP_DEFAULT = 30;

const VALUE_FLAGS = new Map([
  ['--days', 'days'],
  ['--now', 'now'],
  ['--out', 'out'],
  ['--snapshot', 'snapshot'],
  ['--transcript-retention-days', 'retentionDays'],
]);

const parseArgs = (argv) => {
  const queue = [...argv];
  const args = {};
  while (queue.length > 0) {
    const flag = queue.shift();
    if (flag === '--') continue;
    const key = VALUE_FLAGS.get(flag);
    if (key === undefined) {
      throw new Error(
        `unknown argument: ${flag} (see the header comment for usage)`,
      );
    }
    args[key] = queue.shift();
  }
  return args;
};

const positiveInteger = (value, label) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive whole number of days`);
  }
  return parsed;
};

const configuredRetentionDays = () => {
  const settingsPath = join(REPO_ROOT, '.claude', 'settings.json');
  if (!existsSync(settingsPath)) return undefined;
  try {
    return JSON.parse(readFileSync(settingsPath, 'utf8')).cleanupPeriodDays;
  } catch {
    return undefined;
  }
};

const resolveRetention = (args) => {
  if (args.retentionDays !== undefined) {
    return {
      days: positiveInteger(args.retentionDays, '--transcript-retention-days'),
      simulated: true,
    };
  }
  const configured = configuredRetentionDays();
  return {
    days:
      typeof configured === 'number' ? configured : DOCUMENTED_CLEANUP_DEFAULT,
    simulated: false,
  };
};

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
  const read = readWorkflowRuns({
    runGh,
    since: window.start,
    workflows: inventory,
  });
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
  ...readRegisterActivity({
    cwd: REPO_ROOT,
    directory,
    runGit,
    sinceDay: window.start,
  }),
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

const buildReport = ({
  args,
  generatedAt,
  inventory,
  snapshotPath,
  window,
}) => {
  const retention = resolveRetention(args);
  const workingTrees = repositoryWorkingTrees(REPO_ROOT);
  const live = readTranscriptUsage({
    root: transcriptsRoot(),
    since: shiftDay(window.end, -(retention.days - 1)),
    workingTrees,
  });
  const stored = readSnapshot(snapshotPath);
  const merged = mergeTally(stored.days, live.tally);
  writeSnapshot({ days: merged, path: snapshotPath, updatedAt: generatedAt });

  const transcripts = {
    ...live,
    retentionDays: retention.days,
    simulatedHorizon: retention.simulated,
    snapshot: {
      earliestDay: earliestDay(merged),
      path: snapshotPath.replace(`${REPO_ROOT}/`, ''),
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

const printSummary = ({ paths, report }) => {
  const relative = (path) => path.replace(`${REPO_ROOT}/`, '');
  console.log(
    `Harness usage — window ${report.window.start} → ${report.window.end}`,
  );
  console.log(
    `  transcripts: ${report.transcripts.available ? 'read' : `NOT READ — ${report.transcripts.reason}`}`,
  );
  console.log(
    `  workflow runs: ${report.workflows.available ? 'read' : `NOT READ — ${report.workflows.reason}`}`,
  );
  for (const register of report.registers) {
    console.log(
      `  ${register.directory}: ${register.available ? 'read' : `NOT READ — ${register.reason}`}`,
    );
  }
  if (report.shallowClone) {
    console.warn(
      '  warning: this is a shallow clone, so the git-sourced numbers are bounded by the fetched history.',
    );
  }
  console.log(`  wrote ${relative(paths.markdownPath)}`);
  console.log(`  wrote ${relative(paths.jsonPath)}`);
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
