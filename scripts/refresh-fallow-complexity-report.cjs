#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const appDir = path.join(repoRoot, 'apps', 'react-router');
const jsonDir = path.join(repoRoot, 'reports', 'fallow');
const jsonPath = path.join(jsonDir, 'fallow-full-latest.json');
const fallowPackageJsonPath = require.resolve('fallow/package.json', {
  paths: [appDir],
});
const fallowPackageJson = JSON.parse(
  fs.readFileSync(fallowPackageJsonPath, 'utf8'),
);
const fallowBinRelativePath =
  typeof fallowPackageJson.bin === 'string'
    ? fallowPackageJson.bin
    : fallowPackageJson.bin?.fallow;

if (typeof fallowBinRelativePath !== 'string') {
  throw new Error('Unable to resolve fallow CLI bin path from package.json.');
}

const fallowBinPath = path.resolve(
  path.dirname(fallowPackageJsonPath),
  fallowBinRelativePath,
);
const nodeBinDir = path.dirname(process.execPath);
const fixedPathEnv =
  process.platform === 'win32'
    ? `${nodeBinDir};C:\\Windows\\System32`
    : `${nodeBinDir}:/usr/bin:/bin`;
const analysisPath = path.join(
  repoRoot,
  'reports',
  'fallow-complexity-threshold-analysis.md',
);
const trackerPath = path.join(
  repoRoot,
  'apps',
  'react-router',
  'docs',
  'coordination',
  'PROGRESS_TRACKER.md',
);

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const runFallowJson = () => {
  if (!fs.existsSync(fallowBinPath)) {
    throw new Error(
      `fallow executable not found at expected path: ${fallowBinPath}`,
    );
  }

  const result = spawnSync(
    process.execPath,
    [fallowBinPath, '--format', 'json', '--output-file', jsonPath, '--quiet'],
    {
      cwd: appDir,
      stdio: 'inherit',
      env: { ...process.env, PATH: fixedPathEnv },
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const severityRank = {
  critical: 0,
  high: 1,
  moderate: 2,
};

const buildTopFindings = (findings) => {
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
    .slice(0, 8);

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

const refreshAnalysisDoc = (jsonData) => {
  const summary = jsonData.health?.summary ?? {};
  const checkSummary = jsonData.check?.summary ?? {};
  const dupesStats = jsonData.dupes?.stats ?? {};
  const findings = jsonData.health?.findings ?? [];
  const date = new Date().toISOString().slice(0, 10);

  const markdown = `# Fallow Complexity Threshold Analysis

## Canonical Snapshot (${date})

Source of truth for this report:

- Command scope: apps/react-router
- Command: node node_modules/fallow/bin/fallow --format json --output-file ${jsonPath} --quiet
- JSON artifact: reports/fallow/fallow-full-latest.json

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

## Representative High-Severity Findings

${buildTopFindings(findings)}

## Drift Control

1. Run this script before updating planning docs.
2. Keep apps/react-router/docs/coordination/PROGRESS_TRACKER.md baseline aligned to this JSON snapshot.
3. Treat older threshold counts as historical context only.
`;

  fs.writeFileSync(analysisPath, markdown);
};

const refreshTracker = (jsonData) => {
  const summary = jsonData.health?.summary ?? {};
  const checkSummary = jsonData.check?.summary ?? {};
  const dupesStats = jsonData.dupes?.stats ?? {};
  const date = new Date().toISOString().slice(0, 10);
  let tracker = fs.readFileSync(trackerPath, 'utf8');

  tracker = tracker.replace(
    /Last updated: \d{4}-\d{2}-\d{2}/,
    `Last updated: ${date}`,
  );

  tracker = tracker.replace(
    /- Fallow full \(`vp run fallow:full`\): .*$/m,
    `- Fallow full (\`vp run fallow:full\`): ${summary.functions_above_threshold ?? 'n/a'} above threshold · maintainability ${summary.average_maintainability ?? 'n/a'} (good) · ${summary.functions_analyzed ?? 'n/a'} analyzed`,
  );

  tracker = tracker.replace(
    /- Fallow full failures: .*$/m,
    `- Fallow full failures: dead-code (${checkSummary.total_issues ?? jsonData.check?.total_issues ?? 'n/a'} issues), dupes (${dupesStats.clone_groups ?? 'n/a'} clone groups), health (${summary.functions_above_threshold ?? 'n/a'} above threshold)`,
  );

  fs.writeFileSync(trackerPath, tracker);
};

const main = () => {
  ensureDir(jsonDir);
  runFallowJson();

  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  refreshAnalysisDoc(jsonData);
  refreshTracker(jsonData);

  console.log('Fallow snapshot and docs refreshed from JSON source.');
  console.log(`- JSON: ${jsonPath}`);
  console.log(`- Analysis: ${analysisPath}`);
  console.log(`- Tracker: ${trackerPath}`);
};

main();
