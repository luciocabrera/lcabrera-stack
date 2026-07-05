#!/usr/bin/env node
// Fully deterministic — no LLM step anywhere in this script (TECH_SPEC §2.5).
// Produces linter.raw.json, report.json, report.md, and attempts CQMS
// ingestion, all unattended. SKILL.md just invokes this and relays output.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDirectory, '..', '..', '..', '..');

// --- Arg parsing: legacy positional usage (`node script.mjs apps/react-router`,
// always relative to this CQMS repo) stays fully unchanged. `--target=<abs>`
// is new — the CQMS scan-orchestrator uses it to point this script at an
// arbitrary registered project, which may not have `vp`/this repo's own
// tooling at all (ADR-015). ---
const rawArgs = process.argv.slice(2);
const flags = {};
const positional = [];
for (const arg of rawArgs) {
  const match = /^--([^=]+)=(.*)$/.exec(arg);
  if (match) {
    flags[match[1]] = match[2];
  } else if (arg === '--skip-ingest') {
    flags['skip-ingest'] = true;
  } else {
    positional.push(arg);
  }
}

const isTargetMode = Boolean(flags.target);
const scopeArgument =
  flags.scope ?? positional[0] ?? (isTargetMode ? '.' : 'apps/react-router');
const scopeDirectory = isTargetMode
  ? resolve(flags.target, scopeArgument)
  : resolve(repoRoot, scopeArgument);

const runCapturingStdout = (command, args, cwd) => {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    // oxlint/eslint exit non-zero when diagnostics exist — the JSON is still
    // on stdout, so this is not a script failure.
    if (typeof error.stdout === 'string' && error.stdout.length > 0) {
      return error.stdout;
    }
    throw error;
  }
};

const runGit = (args, cwd) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
};

const gitRoot =
  runGit(['rev-parse', '--show-toplevel'], scopeDirectory) ?? scopeDirectory;

const toGitRootRelative = (candidatePath) => {
  const absolute = candidatePath.startsWith('/')
    ? candidatePath
    : join(scopeDirectory, candidatePath);
  return relative(gitRoot, absolute);
};

const ESLINT_CONFIG_NAMES = [
  'eslint.config.mjs',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.ts',
];
const OXLINT_CONFIG_NAMES = ['oxlint.json', '.oxlintrc.json'];

const findConfigFile = (dir, candidateNames) =>
  candidateNames.find((name) => existsSync(join(dir, name)));

// An arbitrary target project's own tooling can be broken in ways this
// repo's own packages never are (mismatched dependency versions, a
// corrupted node_modules, etc.) — a hard execution failure there must
// degrade this one scanner gracefully (0 findings, failure noted in
// top_risk) rather than crash the whole scan and produce no report at all.
const toolFailures = [];

// --- 1. Run oxlint. Legacy mode (no --target) always runs `vp lint` (this
// repo's own tool — vp merges in each app/package's own vite.config.ts
// `lint:` block, matching what a developer actually sees), unchanged from
// the original script. Target mode runs raw `oxlint` instead — an
// arbitrary registered project has no reason to have `vp` installed — and
// only if the target actually opted into an oxlint config; skipping
// gracefully (not erroring) otherwise, since most projects won't. ---
const EMPTY_OXLINT_RESULT = {
  diagnostics: [],
  number_of_files: 0,
  number_of_rules: 0,
};

const runOxlint = () => {
  if (isTargetMode) {
    if (!findConfigFile(scopeDirectory, OXLINT_CONFIG_NAMES)) {
      return EMPTY_OXLINT_RESULT;
    }
    try {
      const raw = runCapturingStdout(
        'npx',
        ['oxlint', '.', '--format', 'json'],
        scopeDirectory,
      );
      return JSON.parse(raw);
    } catch (error) {
      toolFailures.push(`oxlint failed to run: ${error.message}`);
      return EMPTY_OXLINT_RESULT;
    }
  }

  const raw = runCapturingStdout(
    'npx',
    ['vp', 'lint', '.', '--format', 'json'],
    scopeDirectory,
  );
  try {
    return JSON.parse(raw);
  } catch {
    return EMPTY_OXLINT_RESULT;
  }
};

// --- 2. Run the custom-rules eslint pass, only if this scope has one —
// checks every real eslint flat-config filename, not just this repo's own
// `.mjs` convention, since an arbitrary target project may use any of them. ---
const runEslint = () => {
  const eslintConfigName = findConfigFile(scopeDirectory, ESLINT_CONFIG_NAMES);
  if (!eslintConfigName) return [];

  let raw;
  try {
    raw = runCapturingStdout(
      'npx',
      ['eslint', '.', '--config', eslintConfigName, '--format', 'json'],
      scopeDirectory,
    );
  } catch (error) {
    if (isTargetMode) {
      toolFailures.push(`eslint failed to run: ${error.message}`);
      return [];
    }
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const deriveTag = (source, code) => {
  const match = /^([\w-]+)\(([^)]+)\)$/.exec(code ?? '');
  if (match) return match[1];
  const slashIndex = (code ?? '').indexOf('/');
  return slashIndex === -1 ? source : code.slice(0, slashIndex);
};

// Includes the message text, not just (rule_id, location_path,
// location_hint) — some rules (e.g. eslint's perfectionist/sort-imports)
// report multiple distinct messages at the exact same line:column, which
// would otherwise collide and violate scan_findings' (scan_id, finding_id)
// unique constraint. Caught by actually running this against a real
// target, not by inspection.
const makeFindingId = (ruleId, locationPath, locationHint, message) =>
  createHash('sha1')
    .update(`${ruleId}:${locationPath}:${locationHint}:${message}`)
    .digest('hex')
    .slice(0, 12);

// --- 3. Map oxlint diagnostics + eslint messages into the canonical
// scan_findings shape (TECH_SPEC §2.5) — no reshaping left for ingestReport. ---
const mapOxlintDiagnostics = (oxlintResult) =>
  (oxlintResult.diagnostics ?? []).map((diagnostic) => {
    const span = diagnostic.labels?.[0]?.span;
    const locationHint = span ? `${span.line}:${span.column}` : '';
    const locationPath = toGitRootRelative(diagnostic.filename ?? '');
    const ruleId = diagnostic.code ?? 'oxlint(unknown)';
    const message = diagnostic.message ?? 'Lint rule violation.';

    return {
      confidence: 'high',
      effort: 'small',
      evidence_excerpt: null,
      extra: {
        causes: diagnostic.causes ?? null,
        fixable: false,
        source: 'oxlint',
        url: diagnostic.url ?? null,
      },
      finding_id: makeFindingId(ruleId, locationPath, locationHint, message),
      fix: diagnostic.help ?? `Address per rule: ${ruleId}.`,
      location_hint: locationHint,
      location_path: locationPath,
      rule_id: ruleId,
      severity: diagnostic.severity === 'error' ? 'HIGH' : 'MEDIUM',
      status: 'open',
      tags: [deriveTag('oxlint', ruleId)],
      verification_steps: [
        `Re-run \`${isTargetMode ? 'oxlint' : 'vp lint'}\` and confirm ${ruleId} no longer reports here.`,
      ],
      why: message,
    };
  });

const mapEslintResults = (eslintResults) =>
  eslintResults.flatMap((fileResult) =>
    (fileResult.messages ?? []).map((message) => {
      const locationHint = `${message.line}:${message.column}`;
      const locationPath = toGitRootRelative(fileResult.filePath ?? '');
      const ruleId = message.ruleId ?? 'eslint(unknown)';
      const messageText = message.message ?? 'Lint rule violation.';

      return {
        confidence: 'high',
        effort: 'small',
        evidence_excerpt: null,
        extra: {
          causes: null,
          fixable: Boolean(message.fix),
          source: 'eslint',
          url: null,
        },
        finding_id: makeFindingId(
          ruleId,
          locationPath,
          locationHint,
          messageText,
        ),
        fix: `Address per rule: ${ruleId}.`,
        location_hint: locationHint,
        location_path: locationPath,
        rule_id: ruleId,
        severity: message.severity === 2 ? 'HIGH' : 'MEDIUM',
        status: 'open',
        tags: [deriveTag('eslint', ruleId)],
        verification_steps: [
          `Re-run the custom-rules eslint pass and confirm ${ruleId} no longer reports here.`,
        ],
        why: messageText,
      };
    }),
  );

// --- 4. report.md is templated, not authored — mechanically computed from
// report.json (TECH_SPEC §2.5). ---
const renderReportMarkdown = (report) => {
  const countsBySeverity = {
    BLOCKER: 0,
    HIGH: report.high_count,
    LOW: 0,
    MEDIUM: report.medium_count,
    NIT: 0,
  };
  const topRuleCounts = new Map();
  for (const finding of report.findings) {
    topRuleCounts.set(
      finding.rule_id,
      (topRuleCounts.get(finding.rule_id) ?? 0) + 1,
    );
  }
  const topRuleId = [...topRuleCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  const lintToolingLabel = isTargetMode
    ? 'oxlint/eslint (as configured by the target project)'
    : '`vp lint`/eslint';

  const findingsSection =
    report.findings.length === 0
      ? 'No lint findings.'
      : report.findings
          .map(
            (finding) => `### Finding ${finding.finding_id}

- finding_id: ${finding.finding_id}
- rule_id: \`${finding.rule_id}\`
- severity: ${finding.severity}
- confidence: ${finding.confidence}
- location_path: ${finding.location_path}
- location_hint: ${finding.location_hint}
- why: ${finding.why}
- fix: ${finding.fix}
- effort: ${finding.effort}
- verification_steps:
  - ${finding.verification_steps[0]}
- status: ${finding.status}`,
          )
          .join('\n\n');

  const queueByRule = [...topRuleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Math.max(3, topRuleCounts.size))
    .map(([ruleId, count], index) => {
      const targetIds = report.findings
        .filter((f) => f.rule_id === ruleId)
        .map((f) => f.finding_id);
      return `${index + 1}. queue_rank: ${index + 1}
   - target_finding_ids: ${targetIds.join(', ')}
   - reason_for_order: ${count} finding(s) for \`${ruleId}\` — fixing the rule once resolves all instances.
   - expected_outcome: \`${ruleId}\` no longer reported by ${lintToolingLabel}.`;
    })
    .join('\n\n');

  return `# Linter Report

## Metadata

- schema_version: 1.0
- report_id: ${report.report_id}
- generated_at: ${report.generated_at}
- skill_name: linter-checker
- repository: ${isTargetMode ? gitRoot : relative(repoRoot, gitRoot) || '.'}
- scope_type: folder
- scope_value: ${scopeArgument}
- severity_scale: BLOCKER, HIGH, MEDIUM, LOW, NIT

## Summary

- files_analyzed: ${report.files_analyzed}
- findings_count_by_severity:
  - blocker: ${countsBySeverity.BLOCKER}
  - high: ${countsBySeverity.HIGH}
  - medium: ${countsBySeverity.MEDIUM}
  - low: ${countsBySeverity.LOW}
  - nit: ${countsBySeverity.NIT}
- top_risk: ${report.top_risk}
- first_3_actions:
  1. ${topRuleId ? `Fix all instances of \`${topRuleId}\` (the most frequent rule).` : 'No actions required.'}
  2. ${report.findings.length > 0 ? `Re-run ${lintToolingLabel} after fixes.` : ''}
  3. ${report.findings.length > 0 ? 'Confirm CI lint gate is clean before merge.' : ''}

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
- [x] Findings machine-generated directly from oxlint/eslint output (no invented findings)

## Closure Criteria

- No HIGH findings remain unresolved before merge.
- ${lintToolingLabel} report zero diagnostics for this scope.
`;
};

const main = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '--')
    .replace('Z', '');
  // CQMS scratch files always live under this repo's own .tmp, never inside
  // an arbitrary scanned project's working tree (same principle as the
  // Agent-SDK skills' OUTPUT_DIR convention, TECH_SPEC §2.6) — unless the
  // caller (the scan-orchestrator) explicitly overrides it.
  const outputDirectory = flags['output-dir']
    ? resolve(flags['output-dir'])
    : join(repoRoot, '.tmp', 'linter-checker', timestamp);
  mkdirSync(outputDirectory, { recursive: true });

  const oxlintResult = runOxlint();
  const eslintResults = runEslint();

  const rawArtifact = {
    eslint: eslintResults,
    kind: 'combined',
    oxlint: oxlintResult,
  };
  writeFileSync(
    join(outputDirectory, 'linter.raw.json'),
    JSON.stringify(rawArtifact, null, 2),
    'utf8',
  );

  const findings = [
    ...mapOxlintDiagnostics(oxlintResult),
    ...mapEslintResults(eslintResults),
  ];
  const highCount = findings.filter((f) => f.severity === 'HIGH').length;
  const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;
  const topRuleCounts = new Map();
  for (const finding of findings)
    topRuleCounts.set(
      finding.rule_id,
      (topRuleCounts.get(finding.rule_id) ?? 0) + 1,
    );
  const topRule = [...topRuleCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const report = {
    blocker_count: 0,
    files_analyzed: oxlintResult.number_of_files ?? 0,
    findings,
    generated_at: new Date().toISOString(),
    high_count: highCount,
    low_count: 0,
    medium_count: mediumCount,
    nit_count: 0,
    report_id: `linter-${timestamp}`,
    top_risk: topRule
      ? `\`${topRule[0]}\` reported ${topRule[1]} time(s) — the most frequent lint violation in this scope.`
      : toolFailures.length > 0
        ? toolFailures.join(' ')
        : isTargetMode &&
            !findConfigFile(scopeDirectory, OXLINT_CONFIG_NAMES) &&
            !findConfigFile(scopeDirectory, ESLINT_CONFIG_NAMES)
          ? 'No oxlint/eslint configuration detected for this project — nothing was linted.'
          : 'No lint findings.',
  };

  writeFileSync(
    join(outputDirectory, 'report.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  writeFileSync(
    join(outputDirectory, 'report.md'),
    renderReportMarkdown(report),
    'utf8',
  );

  console.log(`Run directory: ${outputDirectory}/`);
  console.log(
    `Findings: ${findings.length} (${highCount} HIGH, ${mediumCount} MEDIUM)`,
  );

  // --- 5. Ingest into CQMS — best-effort, matching the other 3 skills.
  // Skipped when the caller already has its own run/scan row to attach to
  // and will call ingestReport() itself (the scan-orchestrator's case) —
  // --skip-ingest avoids a redundant, ad-hoc-path ingestion attempt. ---
  if (flags['skip-ingest']) return;

  try {
    execFileSync(
      'node',
      [
        '--env-file-if-exists=docker/local/.env',
        '--env-file-if-exists=packages/scan-ingestion/.env',
        '--experimental-strip-types',
        'packages/scan-ingestion/src/cli/ingest.cli.ts',
        '--skill=linter',
        `--run-dir=${outputDirectory}`,
        `--local-path=${gitRoot}`,
        '--scope-type=folder',
        `--scope-value=${scopeArgument}`,
        '--raw-json=linter.raw.json',
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: 'inherit' },
    );
  } catch (error) {
    console.warn(
      `⚠️  CQMS ingestion failed (report files are saved regardless): ${error.message}`,
    );
  }
};

main();
