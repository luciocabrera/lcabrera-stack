/**
 * Reads a unified diff into the lines each file gained, and writes the diff
 * `repo-fallow-gate` hands to a narrowed mutation run. File headers are read
 * only between a `diff --git` line and that file's first hunk. Pure: no I/O.
 */
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

export const joinDiffs = (chunks) =>
  chunks
    .map((chunk) => chunk.trimEnd())
    .filter((chunk) => chunk !== '')
    .map((chunk) => `${chunk}\n`)
    .join('');

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
