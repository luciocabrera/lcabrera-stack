/**
 * Renders the console summary `sonar:report` prints, split out of the script so
 * the wording is testable and the script stays under its size ceiling.
 *
 * The freshness half is the reason this exists as its own module rather than
 * inline template strings: a gate status read without knowing how old the
 * analysis is reads identically whether SonarCloud ran five minutes ago or has
 * been rejecting analyses for ten days. See `sonar-freshness.mjs`.
 */
import { freshnessLine } from './sonar-freshness.mjs';

export const logSafe = (value) => String(value).replaceAll(/[\n\r]/gu, ' ');

const severitySuffix = (bySeverity) => {
  const severities = Object.entries(bySeverity)
    .map(([severity, count]) => `${severity} ${count}`)
    .join(', ');
  return severities ? ` (${severities})` : '';
};

const scopeLine = ({ accepted, analysed }) => {
  const languages = Object.entries(analysed?.byLanguage ?? {})
    .toSorted(([a], [b]) => a.localeCompare(b))
    .map(([language, lines]) => `${language} ${lines}`)
    .join(', ');

  const breakdown = languages ? ` (${languages})` : '';

  return (
    `  scope: ${analysed?.linesOfCode ?? 0} lines${breakdown}` +
    `  accepted: ${accepted ?? 0}`
  );
};

export const summaryLines = (report, outRel, now) => {
  const { qualityGate, summary, target } = report;
  const { line, stale } = freshnessLine(report.analysisDate, now);
  return {
    findings: [
      `SonarCloud — ${report.project} @ ${target.type} ${target.value}`,
      `  quality gate: ${qualityGate.status}`,
      `  issues: ${summary.issues}${severitySuffix(summary.bySeverity)}  hotspots: ${summary.hotspots}`,
      scopeLine(summary),
    ],
    freshness: stale
      ? [
          line,
          '  ⚠ these findings predate the current code — re-check before acting on them',
        ]
      : [line],
    stale,
    written: `  written: ${outRel}`,
  };
};
