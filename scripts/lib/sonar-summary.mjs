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

/**
 * Strip line breaks from anything interpolated into a log line. The report data
 * is fetched from the SonarCloud API and the target comes from CLI args /
 * `.git/HEAD` — external input a log-forging payload could ride in on (CWE-117).
 * Sonar's S5145 flags logging it unsanitised; this is Sonar's own recommended fix.
 */
export const logSafe = (value) => String(value).replaceAll(/[\n\r]/gu, ' ');

const severitySuffix = (bySeverity) => {
  const severities = Object.entries(bySeverity)
    .map(([severity, count]) => `${severity} ${count}`)
    .join(', ');
  return severities ? ` (${severities})` : '';
};

/**
 * The summary as `{ findings, freshness, stale }`.
 *
 * `freshness` is returned separately so the caller can send it to stderr when
 * stale — that way it survives a `| tail` or a grep for the gate line, which is
 * how a stale analysis got mistaken for a current one in the first place.
 */
export const summaryLines = (report, outRel, now) => {
  const { qualityGate, summary, target } = report;
  const { line, stale } = freshnessLine(report.analysisDate, now);
  return {
    findings: [
      `SonarCloud — ${report.project} @ ${target.type} ${target.value}`,
      `  quality gate: ${qualityGate.status}`,
      `  issues: ${summary.issues}${severitySuffix(summary.bySeverity)}  hotspots: ${summary.hotspots}`,
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
