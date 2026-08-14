#!/usr/bin/env node
// Deterministic oxlint scanner — one tool per scanner. Without --target it
// runs `vp lint` (Vite+'s own pass, which merges each workspace's vite.config
// lint block, so it matches what a developer there sees); with --target it runs
// raw `npx oxlint`, and only if the target opted into an oxlint config —
// skipping gracefully otherwise, since most projects won't have one.

import { buildOxlintFixText } from './finding-templates.mjs';
import {
  buildReport,
  deriveTag,
  findConfigFile,
  ingestScanArtifacts,
  makeFindingId,
  makeGitRootRelative,
  makeTimestamp,
  OXLINT_CONFIG_NAMES,
  parseRunContext,
  renderReportMarkdown,
  resolveOutputDirectory,
  runCapturingStdout,
  writeArtifacts,
} from './lint-report-shared.mjs';

const context = parseRunContext();
const toGitRootRelative = makeGitRootRelative(context);

const toolFailures = [];

const EMPTY_OXLINT_RESULT = {
  diagnostics: [],
  number_of_files: 0,
  number_of_rules: 0,
};

const runOxlint = () => {
  if (context.isTargetMode) {
    if (!findConfigFile(context.scopeDirectory, OXLINT_CONFIG_NAMES)) {
      return EMPTY_OXLINT_RESULT;
    }
    try {
      const raw = runCapturingStdout(
        'npx',
        ['oxlint', '.', '--format', 'json'],
        context.scopeDirectory,
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
    context.scopeDirectory,
  );
  try {
    return JSON.parse(raw);
  } catch {
    return EMPTY_OXLINT_RESULT;
  }
};

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
      fix: buildOxlintFixText(diagnostic, ruleId),
      location_hint: locationHint,
      location_path: locationPath,
      rule_id: ruleId,
      severity: diagnostic.severity === 'error' ? 'HIGH' : 'MEDIUM',
      status: 'open',
      tags: [deriveTag('oxlint', ruleId)],
      verification_steps: [
        `Re-run \`${context.isTargetMode ? 'oxlint' : 'vp lint'}\` and confirm ${ruleId} no longer reports here.`,
      ],
      why: message,
    };
  });

const main = () => {
  const timestamp = makeTimestamp();
  const outputDirectory = resolveOutputDirectory(
    context,
    'oxlint-checker',
    timestamp,
  );

  const oxlintResult = runOxlint();
  const findings = mapOxlintDiagnostics(oxlintResult);

  const hasConfig =
    !context.isTargetMode ||
    Boolean(findConfigFile(context.scopeDirectory, OXLINT_CONFIG_NAMES));
  const report = buildReport({
    filesAnalyzed: oxlintResult.number_of_files ?? 0,
    findings,
    noConfigMessage: hasConfig
      ? 'No lint findings.'
      : 'No oxlint configuration detected for this project — nothing was linted.',
    reportIdPrefix: 'oxlint',
    timestamp,
    toolFailures,
  });

  writeArtifacts({
    markdown: renderReportMarkdown({
      context,
      report,
      skillName: 'linter-checker',
      toolLabel: context.isTargetMode ? 'oxlint' : '`vp lint` (oxlint)',
    }),
    outputDirectory,
    rawArtifact: { kind: 'oxlint', ...oxlintResult },
    rawFileName: 'oxlint.raw.json',
    report,
  });

  console.log(`Run directory: ${outputDirectory}/`);
  console.log(
    `Findings: ${findings.length} (${report.high_count} HIGH, ${report.medium_count} MEDIUM)`,
  );

  ingestScanArtifacts({
    context,
    outputDirectory,
    rawFileName: 'oxlint.raw.json',
    scannerId: 'oxlint',
  });
};

main();
