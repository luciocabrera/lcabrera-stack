/**
 * How `repo-fallow-gate` reads what fallow reported. Several analyses exit 0
 * on a finding by design, so their verdict comes from the JSON report, a
 * coverage gap counts only when the diff introduced it, and a suppression
 * passes only when a live entry of the false-positive list names its case.
 * Pure: no I/O.
 */
const ADJUDICATED_REASON = /^false positive, case (FP-\d{4,}): \S/u;

const isAdjudicated = ({ adjudicated, kind, path, reason = '', today }) => {
  const caseId = ADJUDICATED_REASON.exec(reason)?.[1];
  return (
    caseId !== undefined &&
    adjudicated.some(
      (entry) =>
        entry.case === caseId &&
        entry.analyzer === 'fallow' &&
        entry.rule === kind &&
        entry.file === path &&
        typeof entry.expires === 'string' &&
        entry.expires >= today,
    )
  );
};

const suppressionFindings = ({ adjudicated = [], report, today = '' }) =>
  (report.files ?? []).flatMap(({ path, suppressions }) =>
    (suppressions ?? [])
      .filter(
        ({ kind, reason }) =>
          !isAdjudicated({ adjudicated, kind, path, reason, today }),
      )
      .map(({ kind, line, reason }) => ({
        detail: reason
          ? `fallow-ignore ${kind} (${reason})`
          : `fallow-ignore ${kind}`,
        line,
        path,
      })),
  );

const isIntroduced = ({ introduced, line, path }) => {
  const change = introduced.get(path);
  if (change === undefined) return false;
  return (
    change.isNew ||
    change.ranges.some(([start, end]) => line >= start && line <= end)
  );
};

const coverageGapFindings = ({ introduced, report }) => {
  const gaps = report.coverage_gaps ?? {};
  return [
    ...(gaps.files ?? [])
      .filter(({ path }) => isIntroduced({ introduced, path }))
      .map(({ path }) => ({ detail: 'no test reaches this file', path })),
    ...(gaps.exports ?? [])
      .filter(({ line, path }) => isIntroduced({ introduced, line, path }))
      .map(({ export_name: name, line, path }) => ({
        detail: `no test reaches the export \`${name}\``,
        line,
        path,
      })),
  ];
};

const similarCodeFindings = ({ report }) =>
  (report.candidates ?? []).map(({ left, right, similarity }) => ({
    detail: `${left.name} is similar to ${right.name} at ${right.path}:${right.start_line} (similarity ${similarity.toFixed(2)})`,
    line: left.start_line,
    path: left.path,
  }));

const FINDINGS_BY_ANALYSIS = {
  'coverage-gaps': coverageGapFindings,
  'similar-code': similarCodeFindings,
  suppressions: suppressionFindings,
};

export const reportFindings = ({
  adjudicated,
  analysis,
  introduced,
  report,
  today,
}) =>
  FINDINGS_BY_ANALYSIS[analysis]({ adjudicated, introduced, report, today });

export const incompleteReason = ({ analysis, report }) => {
  if (analysis !== 'similar-code') return;
  const status = report.completion?.status;
  return status === 'complete'
    ? undefined
    : `similar-code finished with completion "${status ?? 'missing'}", so an empty candidate list is not conclusive`;
};

export const formatFinding = ({ detail, line, path }) =>
  line === undefined ? `${path}  ${detail}` : `${path}:${line}  ${detail}`;

export const parseReport = (stdout) => {
  const start = stdout.indexOf('{');
  if (start === -1) {
    throw new Error('fallow printed no JSON report');
  }
  return JSON.parse(stdout.slice(start));
};
