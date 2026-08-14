#!/usr/bin/env node
// Deterministic fallow scanner. Runs the
// fallow CLI directly (`fallow --format json`) — no LLM step anywhere; the
// interactive /fallow-code-checker skill keeps the LLM triage flavor.
// Honors the shared deterministic-runner flag contract
// (--target/--scope/--output-dir/--skip-ingest) and produces
// fallow.raw.json (written by fallow itself, verbatim) + report.json +
// report.md unattended.
//
// The fallow binary is resolved from the HOST repo's node_modules (same
// technique as scripts/refresh-fallow-complexity-report.cjs) — an
// arbitrary registered target needs no fallow install or config. fallow
// runs from the target's git root (where workspace config would live);
// when the target sits below its git root, the difference becomes the
// `-w` workspace scope.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';

import {
  hostRoot,
  ingestScanArtifacts,
  makeFindingId,
  makeTimestamp,
  parseRunContext,
  resolveOutputDirectory,
  writeArtifacts,
} from './deterministic-scan-shared.mjs';
import {
  buildCircularDependencyFinding,
  buildCloneGroupFinding,
  buildFunctionFinding,
  buildUnlistedDependencyFinding,
  buildUnresolvedImportFinding,
  buildUnusedDependencyFinding,
  buildUnusedExportFinding,
  buildUnusedFileFinding,
  buildUnusedTypeFinding,
} from './finding-templates.mjs';

const context = parseRunContext();

// An arbitrary target project can break fallow in ways the host repo never
// does — a hard execution failure must degrade this one scanner gracefully
// (0 findings, failure noted in top_risk) rather than crash the whole scan
// A fallow that is installed but exits non-zero against the host's
// OWN repo is still a hard error: that is the host's tooling being broken,
// which it should hear about immediately.
const toolFailures = [];

// `undefined` when the host has no fallow, which is a normal state for a
// consumer that installed this package for its lint scanners only — fallow is
// an OPTIONAL peer. An absent tool is the same kind of answer as oxlint's
// absent config: report nothing, say why, exit 0. Anything else here still
// throws, because a fallow that is installed but unreadable is a real fault.
const resolveFallowBin = () => {
  const require = createRequire(import.meta.url);
  let fallowPackageJsonPath;
  try {
    fallowPackageJsonPath = require.resolve('fallow/package.json', {
      paths: [hostRoot],
    });
  } catch {
    return undefined;
  }
  const fallowPackageJson = JSON.parse(
    readFileSync(fallowPackageJsonPath, 'utf8'),
  );
  const binRelativePath =
    typeof fallowPackageJson.bin === 'string'
      ? fallowPackageJson.bin
      : fallowPackageJson.bin?.fallow;
  if (typeof binRelativePath !== 'string') {
    throw new TypeError(
      'Unable to resolve the fallow CLI bin path from its package.json.',
    );
  }
  return join(dirname(fallowPackageJsonPath), binRelativePath);
};

const NO_FALLOW_MESSAGE = `No fallow installation found under ${hostRoot} — nothing was analysed. Install fallow (an optional peer of @lcabrera/scan-report) to enable this scanner.`;

const WINDOWS_SYSTEM_DIRECTORY = String.raw`C:\Windows\System32`;

const runFallow = (rawArtifactPath) => {
  const fallowBinPath = resolveFallowBin();
  if (fallowBinPath === undefined) {
    toolFailures.push(NO_FALLOW_MESSAGE);
    return undefined;
  }
  // The workspace scope is the target directory + --scope, relative to the
  // git root fallow runs from ('' = scan the whole repo).
  const workspaceScope = relative(context.gitRoot, context.scopeDirectory);

  // Pinned PATH, mirroring scripts/refresh-fallow-complexity-report.cjs:
  // node's own bin dir first, plus the system dirs fallow's git
  // subprocesses (hotspot analysis) need.
  const nodeBinDir = dirname(process.execPath);
  const fixedPathEnv =
    process.platform === 'win32'
      ? `${nodeBinDir};${WINDOWS_SYSTEM_DIRECTORY}`
      : `${nodeBinDir}:/usr/bin:/bin`;

  const result = spawnSync(
    process.execPath,
    [
      fallowBinPath,
      ...(workspaceScope ? ['-w', workspaceScope] : []),
      '--format',
      'json',
      '--output-file',
      rawArtifactPath,
      '--quiet',
    ],
    {
      cwd: context.gitRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: fixedPathEnv },
      maxBuffer: 64 * 1024 * 1024,
    },
  );

  // The JSON artifact on disk is the success signal — fallow's exit code
  // is not load-bearing as long as the output parses.
  if (existsSync(rawArtifactPath)) {
    try {
      return JSON.parse(readFileSync(rawArtifactPath, 'utf8'));
    } catch (error) {
      toolFailures.push(`fallow wrote unparseable JSON: ${error.message}`);
      return undefined;
    }
  }

  const failureDetail =
    result.stderr?.trim() || result.error?.message || `exit ${result.status}`;
  if (!context.isTargetMode) {
    console.error(`fallow failed to run: ${failureDetail}`);
    process.exit(result.status ?? 1);
  }
  toolFailures.push(`fallow failed to run: ${failureDetail}`);
  return undefined;
};

// Canonical severity per the skill's category table (deterministic subset:
// no BLOCKER — escalation to BLOCKER needs the human/LLM judgment the
// interactive skill applies; the raw evidence for it is preserved anyway).
const makeFinding = ({
  effort,
  extra,
  findingKind,
  fix,
  locationHint,
  locationPath,
  ruleId,
  severity,
  tag,
  why,
}) => ({
  confidence: 'high',
  effort,
  evidence_excerpt: null,
  ...(extra ? { extra } : {}),
  finding_id: makeFindingId(ruleId, locationPath, locationHint ?? '', why),
  ...(findingKind ? { finding_kind: findingKind } : {}),
  fix,
  location_hint: locationHint ?? null,
  location_path: locationPath,
  rule_id: ruleId,
  severity,
  status: 'open',
  tags: ['fallow', tag],
  verification_steps: [
    'Re-run the fallow scan and confirm this finding no longer reports.',
  ],
  why,
});

const mapCheckFindings = (check) => {
  if (!check) return [];

  const unusedFiles = (check.unused_files ?? []).map((item) =>
    makeFinding(buildUnusedFileFinding(item)),
  );

  const unusedExports = (check.unused_exports ?? []).map((item) =>
    makeFinding(buildUnusedExportFinding(item)),
  );

  const unusedTypes = (check.unused_types ?? []).map((item) =>
    makeFinding(buildUnusedTypeFinding(item)),
  );

  const unusedDependencies = [
    ...(check.unused_dependencies ?? []).map((item) => ({
      isProd: (item.location ?? 'dependencies') === 'dependencies',
      item,
    })),
    ...(check.unused_dev_dependencies ?? []).map((item) => ({
      isProd: false,
      item,
    })),
    ...(check.unused_optional_dependencies ?? []).map((item) => ({
      isProd: false,
      item,
    })),
  ].map(({ isProd, item }) =>
    makeFinding(buildUnusedDependencyFinding(item, isProd)),
  );

  const unlistedDependencies = (check.unlisted_dependencies ?? []).map((item) =>
    makeFinding(buildUnlistedDependencyFinding(item)),
  );

  const unresolvedImports = (check.unresolved_imports ?? []).map((item) =>
    makeFinding(buildUnresolvedImportFinding(item)),
  );

  const circularDependencies = (check.circular_dependencies ?? []).map((item) =>
    makeFinding(buildCircularDependencyFinding(item)),
  );

  return [
    ...unusedFiles,
    ...unusedExports,
    ...unusedTypes,
    ...unusedDependencies,
    ...unlistedDependencies,
    ...unresolvedImports,
    ...circularDependencies,
  ];
};

const mapCloneGroupFindings = (dupes) =>
  (dupes?.clone_groups ?? []).map((group) =>
    makeFinding(buildCloneGroupFinding(group)),
  );

const mapFunctionFindings = (health) =>
  (health?.findings ?? []).map((item) =>
    makeFinding(buildFunctionFinding(item)),
  );

const buildTopRisk = (raw, findings) => {
  if (toolFailures.length > 0) return toolFailures.join(' ');
  if (!raw) return 'fallow produced no output for this scope.';
  const summary = raw.health?.summary ?? {};
  const parts = [
    `${summary.functions_above_threshold ?? 0} function(s) above complexity thresholds`,
    `${raw.check?.total_issues ?? 0} dead-code issue(s)`,
    `${raw.dupes?.stats?.clone_groups ?? 0} duplicate clone group(s)`,
    `maintainability ${summary.average_maintainability ?? 'n/a'}`,
  ];
  return findings.length === 0
    ? 'No fallow findings for this scope.'
    : parts.join(' · ');
};

const renderFallowReportMarkdown = ({ report }) => {
  const findingsSection =
    report.findings.length === 0
      ? 'No fallow findings.'
      : report.findings
          .map(
            (finding) => `### Finding ${finding.finding_id}

- finding_id: ${finding.finding_id}
- rule_id: \`${finding.rule_id}\`
- severity: ${finding.severity}
- confidence: ${finding.confidence}
- location_path: ${finding.location_path}
- location_hint: ${finding.location_hint ?? 'n/a'}
- why: ${finding.why}
- fix: ${finding.fix}
- effort: ${finding.effort}
- verification_steps:
  - ${finding.verification_steps[0]}
- status: ${finding.status}`,
          )
          .join('\n\n');

  const ruleCounts = new Map();
  for (const finding of report.findings) {
    ruleCounts.set(finding.rule_id, (ruleCounts.get(finding.rule_id) ?? 0) + 1);
  }
  const queueByRule = [...ruleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([ruleId, count], index) => {
      const targetIds = report.findings
        .filter((f) => f.rule_id === ruleId)
        .map((f) => f.finding_id);
      return `${index + 1}. queue_rank: ${index + 1}
   - target_finding_ids: ${targetIds.join(', ')}
   - reason_for_order: ${count} finding(s) for \`${ruleId}\`.
   - expected_outcome: \`${ruleId}\` no longer reported by fallow.`;
    })
    .join('\n\n');

  return `# fallow Report

## Metadata

- schema_version: 1.0
- report_id: ${report.report_id}
- generated_at: ${report.generated_at}
- skill_name: fallow-code-checker
- repository: ${context.isTargetMode ? context.gitRoot : relative(hostRoot, context.gitRoot) || '.'}
- scope_type: folder
- scope_value: ${context.scopeArgument}
- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT
- raw_artifact: fallow.raw.json

## Summary

- files_analyzed: ${report.files_analyzed}
- findings_count_by_severity:
  - blocker: ${report.blocker_count}
  - high: ${report.high_count}
  - medium: ${report.medium_count}
  - low: ${report.low_count}
  - nit: ${report.nit_count}
- top_risk: ${report.top_risk}
- first_3_actions:
  1. ${report.findings.length > 0 ? 'Address HIGH findings first (unresolved imports, unlisted/unused prod dependencies).' : 'No actions required.'}
  2. ${report.findings.length > 0 ? 'Re-run the fallow scan after fixes.' : ''}
  3. ${report.findings.length > 0 ? 'Confirm the dead-code and complexity counts trend down.' : ''}

## Findings

${findingsSection}

## Prioritized Execution Queue

${report.findings.length > 0 ? queueByRule : 'None — no findings.'}

## Deferred Items

None.

## Validation Checklist

- [x] Required sections present
- [x] Required metadata fields present
- [x] Summary counts match findings
- [x] Severity values are canonical
- [x] Findings machine-generated directly from fallow output (no invented findings)

## Closure Criteria

- No HIGH findings remain unresolved before merge.
- fallow reports zero issues for this scope.
`;
};

const main = () => {
  const timestamp = makeTimestamp();
  const outputDirectory = resolveOutputDirectory(
    context,
    'fallow-checker',
    timestamp,
  );
  const rawArtifactPath = join(outputDirectory, 'fallow.raw.json');

  const raw = runFallow(rawArtifactPath);

  const findings = raw
    ? [
        ...mapCheckFindings(raw.check),
        ...mapCloneGroupFindings(raw.dupes),
        ...mapFunctionFindings(raw.health),
      ]
    : [];

  const countBySeverity = (severity) =>
    findings.filter((finding) => finding.severity === severity).length;

  const report = {
    blocker_count: countBySeverity('BLOCKER'),
    files_analyzed: raw?.health?.summary?.files_analyzed ?? 0,
    findings,
    generated_at: new Date().toISOString(),
    ...(raw?.health
      ? {
          health_metrics: {
            summary: raw.health.summary ?? {},
            vital_signs: raw.health.vital_signs ?? {},
          },
        }
      : {}),
    high_count: countBySeverity('HIGH'),
    low_count: countBySeverity('LOW'),
    medium_count: countBySeverity('MEDIUM'),
    nit_count: countBySeverity('NIT'),
    report_id: `fallow-${timestamp}`,
    top_risk: buildTopRisk(raw, findings),
  };

  writeArtifacts({
    markdown: renderFallowReportMarkdown({ report }),
    outputDirectory,
    // fallow already wrote fallow.raw.json verbatim; on failure this stub
    // keeps the artifact contract intact for ingestion (the loose schema
    // degrades it to a zeroed master row).
    rawArtifact: raw ?? { error: toolFailures.join(' '), kind: 'combined' },
    rawFileName: 'fallow.raw.json',
    report,
  });

  console.log(`Run directory: ${outputDirectory}/`);
  console.log(
    `Findings: ${findings.length} (${report.high_count} HIGH, ${report.medium_count} MEDIUM, ${report.low_count} LOW)`,
  );

  ingestScanArtifacts({
    context,
    outputDirectory,
    rawFileName: 'fallow.raw.json',
    scannerId: 'fallow',
  });
};

main();
