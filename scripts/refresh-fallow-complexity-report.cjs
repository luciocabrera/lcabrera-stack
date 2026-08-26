#!/usr/bin/env node

/**
 * Refresh the fallow complexity snapshot and its derived docs.
 *
 * Runs a full fallow scan (dead code + duplication + health) using the root
 * `.fallowrc.json`, writes the raw JSON artifact, and regenerates
 * `reports/fallow/complexity-threshold-analysis.md` from it.
 *
 * Usage:
 *   node scripts/refresh-fallow-complexity-report.cjs [workspace-glob] [--top=N]
 *
 * The optional `workspace-glob` uses fallow `-w` syntax (exact package name,
 * workspace path, glob, or `!` negation). Without it the entire monorepo is
 * scanned. `--top=N` controls how many critical/high findings are listed in
 * the generated summary (default: 20; pass a large N to list them all).
 *
 * @example
 * // Entire monorepo (default) — via vp (preferred) or node directly:
 * //   vp run fallow:refresh-report
 * //   node scripts/refresh-fallow-complexity-report.cjs
 *
 * @example
 * // Scope to the react-router app:
 * //   vp run fallow:refresh-report apps/showcase
 * //   node scripts/refresh-fallow-complexity-report.cjs apps/showcase
 *
 * @example
 * // Scope to all apps except one:
 * //   node scripts/refresh-fallow-complexity-report.cjs 'apps/*,!apps/docs-site'
 *
 * @example
 * // List every critical/high finding (e.g. for an agent handoff):
 * //   vp run fallow:refresh-report --top=1000
 * //   node scripts/refresh-fallow-complexity-report.cjs apps/showcase --top=50
 *
 * Outputs — always under `reports/fallow/`, the single canonical location for
 * every fallow artifact (see AGENTS.md "Fallow Static Analysis"):
 *   - reports/fallow/full-latest.json                  (raw fallow JSON)
 *   - reports/fallow/complexity-threshold-analysis.md  (regenerated summary)
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

const DEFAULT_TOP_FINDINGS = 20;
const cliArgs = process.argv.slice(2);
// Optional workspace glob (fallow -w syntax), e.g. 'apps/showcase' or
// 'apps/*'. No positional argument scans the entire monorepo.
const workspaceScope = cliArgs.find((arg) => !arg.startsWith('--')) ?? null;
const topFlag = cliArgs.find((arg) => arg.startsWith('--top='));
const topFindingsLimit = topFlag
  ? Number.parseInt(topFlag.slice('--top='.length), 10)
  : DEFAULT_TOP_FINDINGS;

if (!Number.isInteger(topFindingsLimit) || topFindingsLimit < 1) {
  throw new TypeError(
    `Invalid --top value: expected a positive integer, got "${topFlag}".`,
  );
}

const jsonDir = path.join(repoRoot, 'reports', 'fallow');
const jsonPath = path.join(jsonDir, 'full-latest.json');
const fallowPackageJsonPath = require.resolve('fallow/package.json', {
  paths: [repoRoot],
});
const fallowPackageJson = JSON.parse(
  fs.readFileSync(fallowPackageJsonPath, 'utf8'),
);
const fallowBinRelativePath =
  typeof fallowPackageJson.bin === 'string'
    ? fallowPackageJson.bin
    : fallowPackageJson.bin?.fallow;

if (typeof fallowBinRelativePath !== 'string') {
  throw new TypeError(
    'Unable to resolve fallow CLI bin path from package.json.',
  );
}

const fallowBinPath = path.resolve(
  path.dirname(fallowPackageJsonPath),
  fallowBinRelativePath,
);
const nodeBinDir = path.dirname(process.execPath);
const windowsSystem32 = String.raw`C:\Windows\System32`;
const fixedPathEnv =
  process.platform === 'win32'
    ? `${nodeBinDir};${windowsSystem32}`
    : `${nodeBinDir}:/usr/bin:/bin`;
const analysisPath = path.join(
  repoRoot,
  'reports',
  'fallow',
  'complexity-threshold-analysis.md',
);

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Run the fallow CLI from the repo root (honoring `workspaceScope`) and write
 * the raw JSON artifact to `reports/fallow/full-latest.json`.
 * Exits the process with fallow's status code on failure.
 */
const runFallowJson = () => {
  if (!fs.existsSync(fallowBinPath)) {
    throw new TypeError(
      `fallow executable not found at expected path: ${fallowBinPath}`,
    );
  }

  const scopeArgs = workspaceScope ? ['-w', workspaceScope] : [];
  const result = spawnSync(
    process.execPath,
    [
      fallowBinPath,
      ...scopeArgs,
      '--format',
      'json',
      '--output-file',
      jsonPath,
      '--quiet',
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit',
      env: { ...process.env, PATH: fixedPathEnv },
    },
  );

  if (result.status !== 0) {
    // Thrown so main() stops before reading JSON this run never wrote.
    throw Object.assign(
      new Error('fallow failed to produce its JSON report.'),
      {
        exitStatus: result.status ?? 1,
      },
    );
  }
};

const severityRank = {
  critical: 0,
  high: 1,
  moderate: 2,
};

/**
 * Render the top critical/high health findings (sorted by severity then CRAP
 * score) as a markdown bullet list.
 *
 * @param {Array<{severity: string, crap?: number, path: string, line: number, symbol?: string, exceeded: string}>} findings
 *   Entries from `health.findings` in the fallow JSON.
 * @param {number} limit Maximum number of findings to list (`--top=N` CLI flag).
 * @returns {string} Markdown bullets, or a placeholder line when none qualify.
 */
const buildTopFindings = (findings, limit) => {
  const ranked = [...findings]
    .filter(
      (finding) =>
        finding.severity === 'critical' || finding.severity === 'high',
    )
    .sort((a, b) => {
      const severityDelta =
        (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99);

      if (severityDelta !== 0) {
        return severityDelta;
      }

      return (b.crap ?? 0) - (a.crap ?? 0);
    })
    .slice(0, limit);

  if (ranked.length === 0) {
    return '- No critical/high findings in current snapshot.';
  }

  return ranked
    .map(
      (finding) =>
        `- ${finding.path}:${finding.line} (${finding.symbol || '<anonymous>'}) - ${finding.severity.toUpperCase()} ${finding.exceeded}`,
    )
    .join('\n');
};

/**
 * Regenerate `reports/fallow/complexity-threshold-analysis.md` from the
 * current fallow JSON snapshot (scope, metrics, top findings).
 *
 * @param {object} jsonData Parsed fallow full-scan JSON (`check`/`dupes`/`health` sections).
 */
const refreshAnalysisDoc = (jsonData) => {
  const summary = jsonData.health?.summary ?? {};
  const checkSummary = jsonData.check?.summary ?? {};
  const dupesStats = jsonData.dupes?.stats ?? {};
  const findings = jsonData.health?.findings ?? [];
  const date = new Date().toISOString().slice(0, 10);

  const markdown = `# Fallow Complexity Threshold Analysis

## Canonical Snapshot (${date})

Source of truth for this report:

- Command scope: ${workspaceScope ?? 'entire monorepo'} (root .fallowrc.json${workspaceScope ? ', scoped via -w' : ''})
- Command: node node_modules/fallow/bin/fallow${workspaceScope ? ` -w ${workspaceScope}` : ''} --format json --output-file ${jsonPath} --quiet
- JSON artifact: reports/fallow/full-latest.json

Current metrics from JSON:

- Functions above threshold: ${summary.functions_above_threshold ?? 'n/a'}
- Functions analyzed: ${summary.functions_analyzed ?? 'n/a'}
- Files analyzed: ${summary.files_analyzed ?? 'n/a'}
- Average maintainability: ${summary.average_maintainability ?? 'n/a'} (good)
- Dead-code issues: ${checkSummary.total_issues ?? jsonData.check?.total_issues ?? 'n/a'} (check.total_issues)
- Duplicate clone groups: ${dupesStats.clone_groups ?? 'n/a'} (dupes.stats.clone_groups)
- Severity split: ${summary.severity_critical_count ?? 0} critical, ${summary.severity_high_count ?? 0} high, ${summary.severity_moderate_count ?? 0} moderate
- Thresholds: cyclomatic ${summary.max_cyclomatic_threshold ?? 'n/a'}, cognitive ${summary.max_cognitive_threshold ?? 'n/a'}, CRAP ${summary.max_crap_threshold ?? 'n/a'}

## Interpretation

Use this report as triage guidance grounded on the current JSON snapshot. For planning and trend tracking, avoid terminal-parsed values and rely on the artifact above.

## Top High-Severity Findings (limit: ${topFindingsLimit} — rerun with --top=N for more)

${buildTopFindings(findings, topFindingsLimit)}

## Drift Control

1. Run this script before updating planning docs.
2. Never copy these numbers into other docs — reference the canonical artifacts in reports/fallow/ instead (single source of truth).
3. Treat older threshold counts as historical context only.
`;

  fs.writeFileSync(analysisPath, markdown);
};

const main = () => {
  ensureDir(jsonDir);
  runFallowJson();

  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  refreshAnalysisDoc(jsonData);

  console.log('Fallow snapshot and docs refreshed from JSON source.');
  console.log(`- Scope: ${workspaceScope ?? 'entire monorepo'}`);
  console.log(`- JSON: ${jsonPath}`);
  console.log(`- Analysis: ${analysisPath}`);
};

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = error.exitStatus ?? 1;
}
