/**
 * How `repo-fallow-gate` reads what fallow reported. Several analyses exit 0
 * on a finding by design, so their verdict comes from the JSON report, and a
 * coverage gap counts only when the diff introduced it. Pure: no I/O.
 */
const suppressionFindings = ({ report }) =>
  (report.files ?? []).flatMap(({ path, suppressions }) =>
    suppressions.map(({ kind, line, reason }) => ({
      detail: `fallow-ignore ${kind}${reason ? ` (${reason})` : ''}`,
      line,
      path,
    })),
  );

const HUNK = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u;

const hunkRange = (line) => {
  const [, start, count = '1'] = HUNK.exec(line);
  return [Number(start), Number(start) + Number(count) - 1];
};

export const parseDiff = (diff) =>
  diff.split('\n').reduce(
    (changes, line) => {
      if (line.startsWith('--- ')) {
        changes.isNew = line === '--- /dev/null';
      } else if (line.startsWith('+++ ')) {
        changes.current = line.startsWith('+++ b/')
          ? line.slice('+++ b/'.length)
          : undefined;
        if (changes.current !== undefined) {
          changes.byPath.set(changes.current, {
            isNew: changes.isNew,
            ranges: [],
          });
        }
      } else if (HUNK.test(line)) {
        changes.byPath.get(changes.current)?.ranges.push(hunkRange(line));
      }
      return changes;
    },
    { byPath: new Map(), current: undefined, isNew: false },
  ).byPath;

export const introducedChanges = ({ diff, files }) => {
  const byPath = parseDiff(diff);
  return new Map(
    files.map((file) => [
      file,
      byPath.get(file) ?? { isNew: true, ranges: [] },
    ]),
  );
};

const isIntroduced = ({ introduced, line, path }) => {
  const change = introduced.get(path);
  if (change === undefined) return false;
  return (
    change.isNew ||
    change.ranges.some(([start, end]) => line >= start && line <= end)
  );
};

const coverageGapFindings = ({ introduced, report }) => {
  const gaps = report.coverage_gaps ?? { exports: [], files: [] };
  return [
    ...gaps.files
      .filter(({ path }) => isIntroduced({ introduced, path }))
      .map(({ path }) => ({ detail: 'no test reaches this file', path })),
    ...gaps.exports
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

export const reportFindings = ({ analysis, introduced, report }) =>
  FINDINGS_BY_ANALYSIS[analysis]({ introduced, report });

export const incompleteReason = ({ analysis, report }) => {
  if (analysis !== 'similar-code') return;
  const status = report.completion?.status;
  return status === 'complete'
    ? undefined
    : `similar-code finished with completion "${status ?? 'missing'}", so an empty candidate list is not conclusive`;
};

export const formatFinding = ({ detail, line, path }) =>
  `${line === undefined ? path : `${path}:${line}`}  ${detail}`;

export const parseReport = (stdout) => {
  const start = stdout.indexOf('{');
  if (start === -1) {
    throw new Error('fallow printed no JSON report');
  }
  return JSON.parse(stdout.slice(start));
};
