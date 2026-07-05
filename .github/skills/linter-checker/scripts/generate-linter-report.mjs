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

const scopeArgument = process.argv[2] ?? 'apps/react-router';
const scopeDirectory = resolve(repoRoot, scopeArgument);

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
  runGit(['rev-parse', '--show-toplevel'], scopeDirectory) ?? repoRoot;

const toGitRootRelative = (candidatePath) => {
  const absolute = candidatePath.startsWith('/')
    ? candidatePath
    : join(scopeDirectory, candidatePath);
  return relative(gitRoot, absolute);
};

// --- 1. Run oxlint via `vp lint` (not the raw oxlint binary) so this
// matches the exact rule set developers actually see — vp merges in each
// app/package's own vite.config.ts `lint:` block. ---
const runOxlint = () => {
  const raw = runCapturingStdout(
    'npx',
    ['vp', 'lint', '.', '--format', 'json'],
    scopeDirectory,
  );
  try {
    return JSON.parse(raw);
  } catch {
    return { diagnostics: [], number_of_files: 0, number_of_rules: 0 };
  }
};

// --- 2. Run the custom-rules eslint pass, only if this scope has one. ---
const runEslint = () => {
  const eslintConfigPath = join(scopeDirectory, 'eslint.config.mjs');
  if (!existsSync(eslintConfigPath)) return [];

  const raw = runCapturingStdout(
    'npx',
    ['eslint', '.', '--config', 'eslint.config.mjs', '--format', 'json'],
    scopeDirectory,
  );
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
        `Re-run \`vp lint\` and confirm ${ruleId} no longer reports here.`,
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
   - expected_outcome: \`${ruleId}\` no longer reported by \`vp lint\`/eslint.`;
    })
    .join('\n\n');

  return `# Linter Report

## Metadata

- schema_version: 1.0
- report_id: ${report.report_id}
- generated_at: ${report.generated_at}
- skill_name: linter-checker
- repository: ${relative(repoRoot, gitRoot) || '.'}
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
  2. ${report.findings.length > 0 ? 'Re-run `vp lint` and the custom-rules eslint pass after fixes.' : ''}
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
- \`vp lint\` and the custom-rules eslint pass both report zero diagnostics for this scope.
`;
};

const main = () => {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '--')
    .replace('Z', '');
  const outputDirectory = join(repoRoot, '.tmp', 'linter-checker', timestamp);
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

  console.log(`Run directory: ${relative(repoRoot, outputDirectory)}/`);
  console.log(
    `Findings: ${findings.length} (${highCount} HIGH, ${mediumCount} MEDIUM)`,
  );

  // --- 5. Ingest into CQMS — best-effort, matching the other 3 skills. ---
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
