#!/usr/bin/env node
// Deterministic fallow scanner (ADR-019 addendum, Phase-3 Step 4). Runs the
// fallow CLI directly (`fallow --format json`) — no LLM step anywhere; the
// interactive /fallow-code-checker skill keeps the LLM triage flavor.
// Honors the shared deterministic-runner flag contract
// (--target/--scope/--output-dir/--skip-ingest) and produces
// fallow.raw.json (written by fallow itself, verbatim) + report.json +
// report.md unattended.
//
// The fallow binary is resolved from THIS repo's node_modules (same
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
  ingestIntoCqms,
  makeFindingId,
  makeTimestamp,
  parseRunContext,
  repoRoot,
  resolveOutputDirectory,
  writeArtifacts,
} from '../../code-smell-shared/scripts/deterministic-scan-shared.mjs';

// Legacy positional default is the whole repo — fallow is configured once
// at a repo root and auto-detects workspaces, unlike the per-app linters.
const context = parseRunContext('.');

// An arbitrary target project can break fallow in ways this repo never
// does — a hard execution failure must degrade this one scanner gracefully
// (0 findings, failure noted in top_risk) rather than crash the whole scan
// (ADR-015).
const toolFailures = [];

const resolveFallowBin = () => {
  const require = createRequire(import.meta.url);
  const fallowPackageJsonPath = require.resolve('fallow/package.json', {
    paths: [repoRoot],
  });
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

const runFallow = (rawArtifactPath) => {
  const fallowBinPath = resolveFallowBin();
  // The workspace scope is the target directory + --scope, relative to the
  // git root fallow runs from ('' = scan the whole repo).
  const workspaceScope = relative(context.gitRoot, context.scopeDirectory);

  // Pinned PATH, mirroring scripts/refresh-fallow-complexity-report.cjs:
  // node's own bin dir first, plus the system dirs fallow's git
  // subprocesses (hotspot analysis) need.
  const nodeBinDir = dirname(process.execPath);
  const fixedPathEnv =
    process.platform === 'win32'
      ? nodeBinDir + ';' + String.raw`C:\Windows\System32`
      : nodeBinDir + ':/usr/bin:/bin';

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

const lineHint = (item) =>
  typeof item.line === 'number'
    ? `${item.line}${typeof item.col === 'number' ? `:${item.col}` : ''}`
    : undefined;

const mapCheckFindings = (check) => {
  if (!check) return [];

  const unusedFiles = (check.unused_files ?? []).map((item) =>
    makeFinding({
      effort: 'small',
      fix: 'Verify no dynamic/framework usage, then delete the file (or suppress with a fallow-ignore-file comment).',
      locationPath: item.path ?? '',
      ruleId: 'fallow/unused-file',
      severity: 'MEDIUM',
      tag: 'dead-code',
      why: 'File is never imported from any detected entry point.',
    }),
  );

  const unusedExports = (check.unused_exports ?? []).map((item) =>
    makeFinding({
      effort: 'small',
      fix: 'Remove the unused export (verify it is not public API if it is a re-export).',
      locationHint: lineHint(item),
      locationPath: item.path ?? '',
      ruleId: 'fallow/unused-export',
      severity: 'MEDIUM',
      tag: 'dead-code',
      why: `Export \`${item.export_name ?? '<unknown>'}\` is never imported anywhere.`,
    }),
  );

  const unusedTypes = (check.unused_types ?? []).map((item) =>
    makeFinding({
      effort: 'small',
      fix: 'Remove the `export` keyword from the type declaration (or delete the type).',
      locationHint: lineHint(item),
      locationPath: item.path ?? '',
      ruleId: 'fallow/unused-type',
      severity: 'LOW',
      tag: 'dead-code',
      why: `Exported type \`${item.export_name ?? '<unknown>'}\` is never imported anywhere.`,
    }),
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
    makeFinding({
      effort: 'small',
      fix: 'Remove the dependency from package.json (or move it to the workspace that actually imports it).',
      locationHint: lineHint(item),
      locationPath: item.path ?? 'package.json',
      ruleId: 'fallow/unused-dependency',
      severity: isProd ? 'HIGH' : 'MEDIUM',
      tag: 'dependencies',
      why: `Dependency \`${item.package_name ?? '<unknown>'}\` is declared but never imported in this workspace.`,
    }),
  );

  const unlistedDependencies = (check.unlisted_dependencies ?? []).map((item) =>
    makeFinding({
      effort: 'small',
      fix: 'Add the package to dependencies in package.json (or to ignoreDependencies in the fallow config if intentional).',
      locationHint: lineHint(item.imported_from?.[0] ?? {}),
      locationPath: item.imported_from?.[0]?.path ?? 'package.json',
      ruleId: 'fallow/unlisted-dependency',
      severity: 'HIGH',
      tag: 'dependencies',
      why: `Package \`${item.package_name ?? '<unknown>'}\` is imported but not declared in package.json.`,
    }),
  );

  const unresolvedImports = (check.unresolved_imports ?? []).map((item) =>
    makeFinding({
      effort: 'small',
      fix: 'Fix the import specifier or restore the missing module.',
      locationHint: lineHint(item),
      locationPath: item.path ?? '',
      ruleId: 'fallow/unresolved-import',
      severity: 'HIGH',
      tag: 'imports',
      why: `Import \`${item.specifier ?? '<unknown>'}\` cannot be resolved.`,
    }),
  );

  const circularDependencies = (check.circular_dependencies ?? []).map((item) =>
    makeFinding({
      effort: 'medium',
      fix: 'Extract the shared logic into a separate module to break the cycle.',
      locationHint: lineHint(item),
      locationPath: item.files?.[0] ?? '',
      ruleId: 'fallow/circular-dependency',
      severity: 'MEDIUM',
      tag: 'architecture',
      why: `Import cycle of length ${item.length ?? item.files?.length ?? 0}: ${(item.files ?? []).join(' → ')}.`,
    }),
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
  (dupes?.clone_groups ?? []).map((group) => {
    const instances = group.instances ?? [];
    const primary = instances[0] ?? {};
    return makeFinding({
      effort: 'medium',
      extra: {
        instances: instances.map((instance) => ({
          location_hint: `${instance.start_line ?? ''}-${instance.end_line ?? ''}`,
          path: instance.file ?? '',
        })),
      },
      findingKind: 'duplication_group',
      fix: `Extract the duplicated block into a shared helper${group.suggested_name ? ` (suggested name: \`${group.suggested_name}\`)` : ''}.`,
      locationHint: `${primary.start_line ?? ''}-${primary.end_line ?? ''}`,
      locationPath: primary.file ?? '',
      ruleId: 'fallow/duplicate-code',
      severity: 'MEDIUM',
      tag: 'duplication',
      why: `${instances.length} duplicated instance(s) of the same ${group.line_count ?? '?'}-line block (${group.token_count ?? '?'} tokens).`,
    });
  });

// fallow's critical|high|moderate → canonical (BLOCKER stays reserved for
// the interactive skill's runtime-impact judgment).
const FUNCTION_SEVERITY_MAP = {
  critical: 'HIGH',
  high: 'MEDIUM',
  moderate: 'LOW',
};

const mapFunctionFindings = (health) =>
  (health?.findings ?? []).map((item) =>
    makeFinding({
      effort: 'medium',
      fix: `Refactor \`${item.name ?? '<anonymous>'}\` below the thresholds (extract helpers) or add test coverage to lower its CRAP score.`,
      locationHint: lineHint(item),
      locationPath: item.path ?? '',
      ruleId: 'fallow/complexity-threshold',
      severity: FUNCTION_SEVERITY_MAP[item.severity] ?? 'LOW',
      tag: 'complexity',
      why: `Function \`${item.name ?? '<anonymous>'}\` exceeds ${item.exceeded ?? 'complexity'} threshold(s): cyclomatic ${item.cyclomatic ?? '?'}, cognitive ${item.cognitive ?? '?'}, CRAP ${item.crap ?? '?'}.`,
    }),
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
- repository: ${context.isTargetMode ? context.gitRoot : relative(repoRoot, context.gitRoot) || '.'}
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

  ingestIntoCqms({
    context,
    outputDirectory,
    rawFileName: 'fallow.raw.json',
    scannerId: 'fallow',
  });
};

main();
