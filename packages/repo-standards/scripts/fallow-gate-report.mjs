/**
 * How `repo-fallow-gate` reads what fallow reported. Several analyses exit 0
 * on a finding by design, so their verdict comes from the JSON report, and a
 * coverage gap counts only when the diff introduced it. Pure: no I/O.
 */
const suppressionFindings = ({ report }) =>
  (report.files ?? []).flatMap(({ path, suppressions }) =>
    suppressions.map(({ kind, line, reason }) => ({
      detail: reason
        ? `fallow-ignore ${kind} (${reason})`
        : `fallow-ignore ${kind}`,
      line,
      path,
    })),
  );

const HUNK = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u;

const hunkRange = (line) => {
  const [, start, count = '1'] = HUNK.exec(line);
  return [Number(start), Number(start) + Number(count) - 1];
};

const track = ({ changes, isNew, path }) => {
  changes.current = path;
  changes.byPath.set(path, { isNew, ranges: [] });
};

const readHeaderLine = ({ changes, line }) => {
  if (line.startsWith('--- ')) {
    changes.isNew = line === '--- /dev/null';
  } else if (line.startsWith('+++ b/')) {
    track({ changes, isNew: changes.isNew, path: line.slice('+++ b/'.length) });
  } else if (line === '+++ /dev/null') {
    changes.byPath.delete(changes.current);
    changes.current = undefined;
  }
};

export const parseDiff = (diff) =>
  diff.split('\n').reduce(
    (changes, line) => {
      if (line.startsWith('diff --git ')) {
        changes.inHeader = true;
        track({
          changes,
          isNew: false,
          path: line.slice(line.lastIndexOf(' b/') + ' b/'.length),
        });
      } else if (HUNK.test(line)) {
        changes.inHeader = false;
        changes.byPath.get(changes.current)?.ranges.push(hunkRange(line));
      } else if (changes.inHeader) {
        readHeaderLine({ changes, line });
      }
      return changes;
    },
    { byPath: new Map(), inHeader: false },
  ).byPath;

export const untrackedFileDiff = ({ content, path }) => {
  const lines = content.endsWith('\n')
    ? content.slice(0, -1).split('\n')
    : content.split('\n');
  return [
    `diff --git a/${path} b/${path}`,
    'new file mode 100644',
    '--- /dev/null',
    `+++ b/${path}`,
    `@@ -0,0 +1,${lines.length} @@`,
    ...lines.map((line) => `+${line}`),
    '',
  ].join('\n');
};

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
  line === undefined ? `${path}  ${detail}` : `${path}:${line}  ${detail}`;

export const parseReport = (stdout) => {
  const start = stdout.indexOf('{');
  if (start === -1) {
    throw new Error('fallow printed no JSON report');
  }
  return JSON.parse(stdout.slice(start));
};
