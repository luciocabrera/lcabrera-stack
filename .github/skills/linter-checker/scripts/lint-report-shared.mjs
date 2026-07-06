// Shared machinery for the per-tool lint report generators (ADR-019 —
// 'linter' split into 'eslint' + 'oxlint'). Fully deterministic, no LLM
// step anywhere. Each entry script (generate-eslint-report.mjs /
// generate-oxlint-report.mjs) runs ONE tool, maps its output into the
// canonical scan_findings shape, writes <tool>.raw.json + report.json +
// report.md, and (unless --skip-ingest) ingests as its own scanner.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = fileURLToPath(new URL('.', import.meta.url));
export const repoRoot = resolve(scriptDirectory, '..', '..', '..', '..');

export const ESLINT_CONFIG_NAMES = [
  'eslint.config.mjs',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.ts',
];
export const OXLINT_CONFIG_NAMES = ['oxlint.json', '.oxlintrc.json'];

// Legacy positional usage (`node script.mjs apps/react-router`, relative to
// this CQMS repo) stays unchanged; `--target=<abs>` is how the
// scan-orchestrator points a script at an arbitrary registered project
// (which may not have vp/this repo's tooling at all — ADR-015).
export const parseRunContext = (defaultLegacyScope = 'apps/react-router') => {
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
    flags.scope ?? positional[0] ?? (isTargetMode ? '.' : defaultLegacyScope);
  const scopeDirectory = isTargetMode
    ? resolve(flags.target, scopeArgument)
    : resolve(repoRoot, scopeArgument);

  const gitRoot =
    runGit(['rev-parse', '--show-toplevel'], scopeDirectory) ?? scopeDirectory;

  return { flags, gitRoot, isTargetMode, scopeArgument, scopeDirectory };
};

export const runCapturingStdout = (command, args, cwd) => {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    // Lint tools exit non-zero when diagnostics exist — the JSON is still
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

export const makeGitRootRelative = (context) => (candidatePath) => {
  const absolute = candidatePath.startsWith('/')
    ? candidatePath
    : join(context.scopeDirectory, candidatePath);
  return relative(context.gitRoot, absolute);
};

export const findConfigFile = (dir, candidateNames) =>
  candidateNames.find((name) => existsSync(join(dir, name)));

export const deriveTag = (source, code) => {
  const match = /^([\w-]+)\(([^)]+)\)$/.exec(code ?? '');
  if (match) return match[1];
  const slashIndex = (code ?? '').indexOf('/');
  return slashIndex === -1 ? source : code.slice(0, slashIndex);
};

// Includes the message text, not just (rule_id, location_path,
// location_hint) — some rules (e.g. eslint's perfectionist/sort-imports)
// report multiple distinct messages at the exact same line:column, which
// would otherwise collide on scan_findings' (scan_id, finding_id) unique
// constraint. Caught by running against a real target, not by inspection.
export const makeFindingId = (ruleId, locationPath, locationHint, message) =>
  createHash('sha1')
    .update(`${ruleId}:${locationPath}:${locationHint}:${message}`)
    .digest('hex')
    .slice(0, 12);

export const makeTimestamp = () =>
  new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '--')
    .replace('Z', '');

// CQMS scratch files always live under this repo's own .tmp, never inside
// an arbitrary scanned project's working tree — unless the caller (the
// scan-orchestrator) explicitly overrides it.
export const resolveOutputDirectory = (context, skillTmpName, timestamp) => {
  const outputDirectory = context.flags['output-dir']
    ? resolve(context.flags['output-dir'])
    : join(repoRoot, '.tmp', skillTmpName, timestamp);
  mkdirSync(outputDirectory, { recursive: true });
  return outputDirectory;
};

export const buildReport = ({
  filesAnalyzed,
  findings,
  noConfigMessage,
  reportIdPrefix,
  timestamp,
  toolFailures,
}) => {
  const highCount = findings.filter((f) => f.severity === 'HIGH').length;
  const mediumCount = findings.filter((f) => f.severity === 'MEDIUM').length;
  const topRuleCounts = new Map();
  for (const finding of findings)
    topRuleCounts.set(
      finding.rule_id,
      (topRuleCounts.get(finding.rule_id) ?? 0) + 1,
    );
  const topRule = [...topRuleCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    blocker_count: 0,
    files_analyzed: filesAnalyzed,
    findings,
    generated_at: new Date().toISOString(),
    high_count: highCount,
    low_count: 0,
    medium_count: mediumCount,
    nit_count: 0,
    report_id: `${reportIdPrefix}-${timestamp}`,
    top_risk: topRule
      ? `\`${topRule[0]}\` reported ${topRule[1]} time(s) — the most frequent lint violation in this scope.`
      : toolFailures.length > 0
        ? toolFailures.join(' ')
        : (noConfigMessage ?? 'No lint findings.'),
  };
};

export const renderReportMarkdown = ({
  context,
  report,
  skillName,
  toolLabel,
}) => {
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
   - expected_outcome: \`${ruleId}\` no longer reported by ${toolLabel}.`;
    })
    .join('\n\n');

  return `# ${toolLabel} Report

## Metadata

- schema_version: 1.0
- report_id: ${report.report_id}
- generated_at: ${report.generated_at}
- skill_name: ${skillName}
- repository: ${context.isTargetMode ? context.gitRoot : relative(repoRoot, context.gitRoot) || '.'}
- scope_type: folder
- scope_value: ${context.scopeArgument}
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
  2. ${report.findings.length > 0 ? `Re-run ${toolLabel} after fixes.` : ''}
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
- [x] Findings machine-generated directly from ${toolLabel} output (no invented findings)

## Closure Criteria

- No HIGH findings remain unresolved before merge.
- ${toolLabel} reports zero diagnostics for this scope.
`;
};

export const writeArtifacts = ({
  markdown,
  outputDirectory,
  rawArtifact,
  rawFileName,
  report,
}) => {
  writeFileSync(
    join(outputDirectory, rawFileName),
    JSON.stringify(rawArtifact, null, 2),
    'utf8',
  );
  writeFileSync(
    join(outputDirectory, 'report.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );
  writeFileSync(join(outputDirectory, 'report.md'), markdown, 'utf8');
};

// Best-effort CQMS ingestion, matching the other skills. Skipped when the
// caller (the scan-orchestrator) already has its own run/scan row and will
// call ingestReport() itself.
export const ingestIntoCqms = ({
  context,
  outputDirectory,
  rawFileName,
  scannerId,
}) => {
  if (context.flags['skip-ingest']) return;

  try {
    execFileSync(
      'node',
      [
        '--env-file-if-exists=docker/local/.env',
        '--env-file-if-exists=packages/scan-ingestion/.env',
        '--experimental-strip-types',
        'packages/scan-ingestion/src/cli/ingest.cli.ts',
        `--skill=${scannerId}`,
        `--run-dir=${outputDirectory}`,
        `--local-path=${context.gitRoot}`,
        '--scope-type=folder',
        `--scope-value=${context.scopeArgument}`,
        `--raw-json=${rawFileName}`,
      ],
      { cwd: repoRoot, encoding: 'utf8', stdio: 'inherit' },
    );
  } catch (error) {
    console.warn(
      `⚠️  CQMS ingestion failed (report files are saved regardless): ${error.message}`,
    );
  }
};
