/**
 * Pulls SonarCloud findings for this project into a tracked JSON report, so
 * agents and CI act on Sonar the way they already act on the fallow/lint
 * reports — from a file in `reports/`, not by reading the dashboard.
 *
 * Why this exists: SonarCloud runs in Automatic Analysis mode (there is no
 * scanner in this repo — the GitHub App analyses each push server-side). So
 * there is nothing local to run and no findings on disk; the only programmatic
 * access is the SonarCloud Web API. This script is that bridge:
 *   - `sonar:report`         fetch issues + hotspots + quality gate, write
 *                            `reports/sonar/full-latest.json` (deterministic,
 *                            tracked — no timestamps, stable sort → no churn).
 *   - `sonar:verify` (`--gate`) same fetch, but exit non-zero when the SonarCloud
 *                            quality gate is failing — a local mirror of the gate
 *                            you can run or wire into CI.
 *
 * Auth: a SonarCloud user token in `SONAR_TOKEN`, loaded from a gitignored root
 * `.env` if present, else the environment / a CI secret. Never commit it. The
 * token is read-only — it needs only browse permission on the project.
 *
 * Deliberately no `child_process`: the branch is read from `.git/HEAD` on disk.
 * An `execFile('git' | 'gh', …)` would trip Sonar's own S4036 (searching OS
 * commands on PATH) hotspot — the exact finding this tooling exists to keep out
 * of the tree.
 *
 * Feature branches: SonarCloud analyses them as pull requests, not standalone
 * branches, so a `branch=<feature>` query 404s. On a non-main branch with no
 * `--pr`, the script prints how to target the PR instead of erroring.
 *
 * Usage (from the repo root):
 *   vp run sonar:report                    # main snapshot, or a hint on a feature branch
 *   vp run sonar:report -- --pr 31         # a specific pull request
 *   vp run sonar:report -- --branch main
 *   vp run sonar:verify                    # gate mode: exit 1 if the gate is failing
 *   vp run sonar:verify -- --pr 31 --fail-on-issues
 *   vp run sonar:verify -- --pr 31 --fail-on-issues --wait --since <iso>
 *
 * `--wait` (CI use) polls the Compute Engine until this target's analysis has
 * finished before reading — Automatic Analysis is async, so a bare read races it.
 * `--since <iso>` (the PR head commit time) guards freshness so a previous
 * commit's analysis isn't accepted; on timeout the check is skipped, not failed,
 * so Sonar latency never blocks a merge (the required SonarCloud check still gates).
 *
 * Exit codes: 0 = report written / gate OK (or skipped when no token / wait
 *             timeout), 1 = gate failing, new issues (--fail-on-issues),
 *             analysis failed, fetch error, or bad arguments.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { logSafe, summaryLines } from './lib/sonar-summary.mjs';
import { waitForAnalysis } from './lib/sonar-wait.mjs';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const OUT_REL = 'reports/sonar/full-latest.json';
const OUT_PATH = join(REPO_ROOT, OUT_REL);

const CONFIG = {
  base: process.env.SONAR_BASE_URL ?? 'https://sonarcloud.io',
  project: process.env.SONAR_PROJECT_KEY ?? 'luciocabrera_vite-react-compiler',
  mainBranch: process.env.SONAR_MAIN_BRANCH ?? 'main',
};
const PAGE_SIZE = 500;
const MAX_PAGES = 20;

// --- pure helpers ---------------------------------------------------------

/**
 * Flags that simply flip a boolean, and flags that consume the next argv value.
 * Table-driven so adding a flag is a table entry, not another branch: this
 * function is on the strictest cognitive-complexity budget in the repo and a
 * per-flag `if` chain had already outgrown it.
 */
const BOOLEAN_FLAGS = new Map([
  ['--gate', 'gate'],
  ['--fail-on-issues', 'failOnIssues'],
  ['--wait', 'wait'],
  ['--require-token', 'requireToken'],
]);

const VALUE_FLAGS = new Map([
  ['--pr', 'pr'],
  ['--branch', 'branch'],
  ['--since', 'since'],
]);

const parseArgs = (argv) => {
  const args = {
    gate: false,
    failOnIssues: false,
    wait: false,
    requireToken: false,
    pr: undefined,
    branch: undefined,
    since: undefined,
  };
  const queue = [...argv];
  while (queue.length > 0) {
    const flag = queue.shift();
    const booleanKey = BOOLEAN_FLAGS.get(flag);
    if (booleanKey !== undefined) {
      args[booleanKey] = true;
      continue;
    }
    const valueKey = VALUE_FLAGS.get(flag);
    if (valueKey !== undefined) {
      args[valueKey] = queue.shift();
      continue;
    }
    if (flag !== '--') {
      throw new Error(
        `unknown argument: ${flag} (see the header comment for usage)`,
      );
    }
  }
  return args;
};

/** Current branch from `.git/HEAD` — filesystem only, no subprocess (S4036). */
const currentBranch = () => {
  const head = join(REPO_ROOT, '.git/HEAD');
  if (!existsSync(head)) return undefined;
  const ref = /^ref:\s+refs\/heads\/(.+)$/.exec(
    readFileSync(head, 'utf8').trim(),
  );
  return ref?.[1]; // detached HEAD → undefined
};

/** Resolve what to query. `explicit` marks a user-supplied target (skips the
 *  feature-branch hint). */
const resolveTarget = (args) => {
  if (args.pr !== undefined) {
    return {
      target: { type: 'pullRequest', value: String(args.pr) },
      explicit: true,
    };
  }
  if (args.branch !== undefined) {
    return { target: { type: 'branch', value: args.branch }, explicit: true };
  }
  const branch = currentBranch() ?? CONFIG.mainBranch;
  return { target: { type: 'branch', value: branch }, explicit: false };
};

const targetParam = (target) =>
  target.type === 'pullRequest'
    ? `pullRequest=${encodeURIComponent(target.value)}`
    : `branch=${encodeURIComponent(target.value)}`;

const relPath = (component) =>
  component.startsWith(`${CONFIG.project}:`)
    ? component.slice(CONFIG.project.length + 1)
    : component;

const normIssue = (issue) => ({
  key: issue.key,
  rule: issue.rule,
  type: issue.type,
  severity: issue.severity,
  file: relPath(issue.component),
  line: issue.line ?? null,
  message: issue.message,
  effort: issue.effort ?? null,
  // Sonar returns tags/impacts in an unstable order; sort so the tracked
  // report is byte-identical run to run (no git churn).
  tags: (issue.tags ?? []).toSorted(),
  impacts: (issue.impacts ?? []).toSorted(
    (a, b) =>
      a.softwareQuality.localeCompare(b.softwareQuality) ||
      a.severity.localeCompare(b.severity),
  ),
  cleanCodeCategory: issue.cleanCodeAttributeCategory ?? null,
  status: issue.issueStatus ?? issue.status,
  creationDate: issue.creationDate,
});

const normHotspot = (hotspot) => ({
  key: hotspot.key,
  rule: hotspot.ruleKey,
  file: relPath(hotspot.component),
  line: hotspot.line ?? null,
  message: hotspot.message,
  vulnerabilityProbability: hotspot.vulnerabilityProbability,
  securityCategory: hotspot.securityCategory,
  status: hotspot.status,
});

const normGate = (projectStatus) => ({
  status: projectStatus?.status ?? 'NONE',
  conditions: (projectStatus?.conditions ?? [])
    .map((condition) => ({
      metric: condition.metricKey,
      status: condition.status,
      comparator: condition.comparator,
      errorThreshold: condition.errorThreshold ?? null,
      actualValue: condition.actualValue ?? null,
    }))
    .toSorted((a, b) => a.metric.localeCompare(b.metric)),
});

/** Stable ordering so an unchanged tree writes a byte-identical report. */
const byLocation = (a, b) =>
  (a.file ?? '').localeCompare(b.file ?? '') ||
  (a.line ?? 0) - (b.line ?? 0) ||
  (a.rule ?? '').localeCompare(b.rule ?? '') ||
  a.key.localeCompare(b.key);

const countBy = (items, pick) => {
  const counts = {};
  for (const item of items) {
    const key = pick(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
};

const buildReport = (target, gate, issues, hotspots, analysisDate) => {
  const normIssues = issues.map(normIssue).toSorted(byLocation);
  const normHotspots = hotspots.map(normHotspot).toSorted(byLocation);
  return {
    project: CONFIG.project,
    source: CONFIG.base,
    target,
    // The analysis this snapshot came from, so a reader of the tracked file can
    // tell an old result from a current one. Still deterministic: it is a
    // property of the analysis, not of the run, so two fetches of the same
    // analysis produce identical bytes. Only a genuinely new analysis moves it.
    analysisDate: analysisDate ?? null,
    qualityGate: normGate(gate),
    summary: {
      issues: normIssues.length,
      hotspots: normHotspots.length,
      bySeverity: countBy(normIssues, (i) => i.severity),
      byType: countBy(normIssues, (i) => i.type),
    },
    issues: normIssues,
    hotspots: normHotspots,
  };
};

/** Gate failures as a list of human-readable problems (empty = pass). */
const gateProblems = (report, failOnIssues) => {
  const problems = [];
  if (report.qualityGate.status !== 'OK') {
    problems.push(`quality gate is ${report.qualityGate.status}`);
    for (const condition of report.qualityGate.conditions.filter(
      (c) => c.status !== 'OK',
    )) {
      problems.push(
        `  ${condition.metric}: ${condition.actualValue} ` +
          `(fails ${condition.comparator} ${condition.errorThreshold})`,
      );
    }
  }
  if (failOnIssues && report.summary.issues > 0) {
    problems.push(
      `${report.summary.issues} unresolved issue(s) on ${report.target.type} ${report.target.value}`,
    );
  }
  return problems;
};

// --- effects (edges) ------------------------------------------------------

const authHeader = (token) => {
  const encoded = Buffer.from(`${token}:`).toString('base64');
  return `Basic ${encoded}`;
};

const fetchJson = async (url, token) => {
  const response = await fetch(url, {
    headers: { Authorization: authHeader(token) },
  });
  if (!response.ok) {
    throw new Error(
      `GET ${url} → ${response.status}: ${(await response.text()).slice(0, 200)}`,
    );
  }
  return response.json();
};

const fetchAllPages = async (buildUrl, token, pluck) => {
  const collected = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while (page <= MAX_PAGES && collected.length < total) {
    const body = await fetchJson(buildUrl(page), token);
    const items = pluck(body);
    if (items.length === 0) break;
    collected.push(...items);
    total = body.paging?.total ?? body.total ?? collected.length;
    page += 1;
  }
  return collected;
};

const fetchIssues = (token, target) =>
  fetchAllPages(
    (page) =>
      `${CONFIG.base}/api/issues/search?componentKeys=${CONFIG.project}` +
      `&resolved=false&${targetParam(target)}&ps=${PAGE_SIZE}&p=${page}`,
    token,
    (body) => body.issues ?? [],
  );

const fetchHotspots = (token, target) =>
  fetchAllPages(
    (page) =>
      `${CONFIG.base}/api/hotspots/search?projectKey=${CONFIG.project}` +
      `&${targetParam(target)}&ps=${PAGE_SIZE}&p=${page}`,
    token,
    (body) => body.hotspots ?? [],
  );

const fetchGate = async (token, target) => {
  const body = await fetchJson(
    `${CONFIG.base}/api/qualitygates/project_status?projectKey=${CONFIG.project}&${targetParam(target)}`,
    token,
  );
  return body.projectStatus;
};

/**
 * When SonarCloud last analysed this target. Undefined for a target it has
 * never analysed — which the freshness helper deliberately treats as stale.
 */
const fetchAnalysisDate = async (token, target) => {
  const body = await fetchJson(
    `${CONFIG.base}/api/components/show?component=${CONFIG.project}&${targetParam(target)}`,
    token,
  );
  return body.component?.analysisDate;
};

const loadEnv = () => {
  const envFile = join(REPO_ROOT, '.env');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
};

const writeReport = (report) => {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
};

const printSummary = (report) => {
  const parts = summaryLines(report, OUT_REL, Date.now());
  for (const line of parts.findings) console.log(logSafe(line));
  // A stale freshness note goes to stderr so it survives a `| tail` or a grep
  // for the gate line — how a ten-day-old analysis got read as current once.
  const emit = parts.stale ? console.warn : console.log;
  for (const line of parts.freshness) emit(logSafe(line));
  console.log(logSafe(parts.written));
};

const printNoToken = (gateMode) => {
  const log = gateMode ? console.warn : console.log;
  log('SONAR_TOKEN is not set — skipping SonarCloud fetch.');
  log(
    'Add it to a gitignored root .env (SONAR_TOKEN=…) or, in CI, a repo secret.',
  );
  log(
    'Generate one at SonarCloud → My Account → Security → Generate Tokens (User Token).',
  );
  if (gateMode)
    log(
      'Gate skipped (not failed) so tokenless contexts — e.g. forks — stay green.',
    );
};

const printBranchHint = (branch) => {
  console.log(
    logSafe(
      `On branch \`${branch}\`. SonarCloud analyses feature branches as pull requests,`,
    ),
  );
  console.log(
    'so there is no standalone branch analysis to fetch. Re-run targeting the PR:',
  );
  console.log('  vp run sonar:report -- --pr <number>');
  console.log(
    '  vp run sonar:report -- --branch main   # or the main snapshot',
  );
};

// --- orchestration --------------------------------------------------------

const main = async () => {
  loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const { target, explicit } = resolveTarget(args);

  if (!explicit && target.value !== CONFIG.mainBranch) {
    printBranchHint(target.value);
    return;
  }

  const token = process.env.SONAR_TOKEN;
  if (!token) {
    printNoToken(args.gate && !args.requireToken);
    if (args.requireToken) {
      console.error(
        'SONAR_TOKEN is required in this context but was not provided — ' +
          'refusing to report a gate as passing when it never ran. ' +
          'Pass --require-token only where the secret is available ' +
          '(same-repo pull requests); fork PRs must omit it.',
      );
      process.exitCode = 1;
    }
    return;
  }

  if (args.wait) {
    const ready = await waitForAnalysis({
      fetchJson,
      token,
      base: CONFIG.base,
      project: CONFIG.project,
      target,
      since: args.since,
    });
    if (!ready) {
      console.warn(
        `Timed out waiting for SonarCloud analysis of ${target.type} ${target.value} — ` +
          'skipping the strict issue check (the required SonarCloud check still gates).',
      );
      return;
    }
  }

  const [gate, issues, hotspots, analysisDate] = await Promise.all([
    fetchGate(token, target),
    fetchIssues(token, target),
    fetchHotspots(token, target),
    fetchAnalysisDate(token, target),
  ]);
  const report = buildReport(target, gate, issues, hotspots, analysisDate);
  writeReport(report);
  printSummary(report);

  if (args.gate) {
    const problems = gateProblems(report, args.failOnIssues);
    if (problems.length > 0) {
      console.error('\nSonar gate FAILED:');
      for (const problem of problems) console.error(logSafe(`  - ${problem}`));
      process.exitCode = 1;
      return;
    }
    console.log('  gate: PASS');
  }
};

try {
  await main();
} catch (error) {
  console.error(logSafe(error.message));
  process.exitCode = 1;
}
