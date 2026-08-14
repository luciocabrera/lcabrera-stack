// Lint-specific machinery for the per-tool lint report generators
// (ADR-019 — 'linter' split into 'eslint' + 'oxlint'). Fully
// deterministic, no LLM step anywhere. Each entry script
// (generate-eslint-report.mjs / generate-oxlint-report.mjs) runs ONE tool,
// maps its output into the canonical scan_findings shape, writes
// <tool>.raw.json + report.json + report.md, and hands the run to the
// configured ingestion command (unless --skip-ingest).
//
// The scanner-agnostic helpers (arg parsing, finding ids, artifact writing,
// ingestion) live in deterministic-scan-shared.mjs — shared with
// generate-fallow-report.mjs — and are re-exported here so the two lint entry
// scripts keep a single import site.

import { relative } from 'node:path';

import { hostRoot } from './deterministic-scan-shared.mjs';

export {
  findConfigFile,
  hostRoot,
  ingestScanArtifacts,
  makeFindingId,
  makeGitRootRelative,
  makeTimestamp,
  parseRunContext,
  resolveOutputDirectory,
  runCapturingStdout,
  writeArtifacts,
} from './deterministic-scan-shared.mjs';

export const ESLINT_CONFIG_NAMES = [
  'eslint.config.mjs',
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.ts',
];
export const OXLINT_CONFIG_NAMES = ['oxlint.json', '.oxlintrc.json'];

export const deriveTag = (source, code) => {
  const match = /^([\w-]+)\(([^)]+)\)$/.exec(code ?? '');
  if (match) return match[1];
  const slashIndex = (code ?? '').indexOf('/');
  return slashIndex === -1 ? source : code.slice(0, slashIndex);
};

/**
 * The one headline line of a lint report, in precedence order: the rule that
 * fired most, then whatever stopped the tool from running, then why there was
 * nothing to report.
 */
const describeTopRisk = ({ noConfigMessage, toolFailures, topRule }) => {
  if (topRule) {
    return `\`${topRule[0]}\` reported ${topRule[1]} time(s) — the most frequent lint violation in this scope.`;
  }
  if (toolFailures.length > 0) return toolFailures.join(' ');
  return noConfigMessage ?? 'No lint findings.';
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
    top_risk: describeTopRisk({ noConfigMessage, toolFailures, topRule }),
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
- repository: ${context.isTargetMode ? context.gitRoot : relative(hostRoot, context.gitRoot) || '.'}
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
