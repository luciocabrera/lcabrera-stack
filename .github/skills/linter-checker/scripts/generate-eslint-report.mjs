#!/usr/bin/env node
// Deterministic eslint scanner (ADR-019 — one tool per scanner). Runs the
// custom-rules eslint pass only if the scope has a flat config (checking
// every real config filename — an arbitrary target may use any of them),
// producing eslint.raw.json + report.json + report.md unattended.

import {
  buildReport,
  deriveTag,
  ESLINT_CONFIG_NAMES,
  findConfigFile,
  ingestIntoCqms,
  makeFindingId,
  makeGitRootRelative,
  makeTimestamp,
  parseRunContext,
  renderReportMarkdown,
  resolveOutputDirectory,
  runCapturingStdout,
  writeArtifacts,
} from './lint-report-shared.mjs';

const context = parseRunContext();
const toGitRootRelative = makeGitRootRelative(context);

// An arbitrary target project's own tooling can be broken in ways this
// repo's packages never are — a hard execution failure must degrade this
// one scanner gracefully (0 findings, failure noted in top_risk) rather
// than crash the whole scan (ADR-015).
const toolFailures = [];

const runEslint = () => {
  const eslintConfigName = findConfigFile(
    context.scopeDirectory,
    ESLINT_CONFIG_NAMES,
  );
  if (!eslintConfigName) return [];

  let raw;
  try {
    raw = runCapturingStdout(
      'npx',
      ['eslint', '.', '--config', eslintConfigName, '--format', 'json'],
      context.scopeDirectory,
    );
  } catch (error) {
    if (context.isTargetMode) {
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
          `Re-run the eslint pass and confirm ${ruleId} no longer reports here.`,
        ],
        why: messageText,
      };
    }),
  );

const main = () => {
  const timestamp = makeTimestamp();
  const outputDirectory = resolveOutputDirectory(
    context,
    'eslint-checker',
    timestamp,
  );

  const eslintResults = runEslint();
  const findings = mapEslintResults(eslintResults);

  const hasConfig = Boolean(
    findConfigFile(context.scopeDirectory, ESLINT_CONFIG_NAMES),
  );
  const report = buildReport({
    filesAnalyzed: eslintResults.length,
    findings,
    noConfigMessage: hasConfig
      ? 'No lint findings.'
      : 'No eslint configuration detected for this project — nothing was linted.',
    reportIdPrefix: 'eslint',
    timestamp,
    toolFailures,
  });

  writeArtifacts({
    markdown: renderReportMarkdown({
      context,
      report,
      skillName: 'linter-checker',
      toolLabel: 'eslint',
    }),
    outputDirectory,
    rawArtifact: { kind: 'eslint', results: eslintResults },
    rawFileName: 'eslint.raw.json',
    report,
  });

  console.log(`Run directory: ${outputDirectory}/`);
  console.log(
    `Findings: ${findings.length} (${report.high_count} HIGH, ${report.medium_count} MEDIUM)`,
  );

  ingestIntoCqms({
    context,
    outputDirectory,
    rawFileName: 'eslint.raw.json',
    scannerId: 'eslint',
  });
};

main();
