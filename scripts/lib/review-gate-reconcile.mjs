/**
 * The reconcile sweep's two decisions, kept pure: which pull requests a sweep
 * visits, and whether a freshly computed status is worth publishing over the one
 * already on the head.
 *
 * Why a sweep exists when the review gates are event-driven: the events they
 * depend on are not delivered reliably in this repository, and a status nobody
 * recomputed reads exactly like one that is honestly still waiting. Issue #737
 * carries the measurement and the two commands that reproduce it;
 * `docs/tooling/review-gate-reconcile.md` carries the reasoning, the interval,
 * and what the sweep does when it fails.
 *
 * The I/O shells are `scripts/reconcile-review-gates.mjs` and the gate scripts
 * it drives.
 *
 * Governed by .claude/rules/scripts.md.
 */

/**
 * States that mean the gate has already witnessed something terminal.
 *
 * `error` is included for completeness — no gate here publishes it today, and a
 * hand-posted one still must not be quietly downgraded.
 */
const TERMINAL_STATES = new Set(['error', 'failure']);

const pullNumber = (pull) =>
  Number.isInteger(pull?.number) && pull.number > 0 ? pull.number : undefined;

export const openPullRequestNumbers = (pages) => {
  if (!Array.isArray(pages)) {
    return [];
  }
  const numbers = pages
    .flat()
    .map((pull) => pullNumber(pull))
    .filter((number) => number !== undefined);
  return [...new Set(numbers)].sort((left, right) => left - right);
};

export const publishedStatus = (combined, context) => {
  const newest = (Array.isArray(combined?.statuses) ? combined.statuses : [])
    .filter((status) => status?.context === context)
    .reduce(
      (latest, status) =>
        latest === undefined || postedMillis(status) >= postedMillis(latest)
          ? status
          : latest,
      undefined,
    );
  return newest === undefined
    ? undefined
    : {
        description: newest.description ?? '',
        state: (newest.state ?? '').toLowerCase(),
      };
};

const postedMillis = (status) => Date.parse(status?.created_at ?? '') || 0;

export const shouldPublishStatus = ({
  current,
  next,
  protectSuccess = false,
} = {}) => {
  if (next === undefined) {
    return false;
  }
  if (current === undefined) {
    return true;
  }
  if (
    current.state === next.state &&
    current.description === next.description
  ) {
    return false;
  }
  if (
    protectSuccess &&
    current.state === 'success' &&
    next.state !== 'success'
  ) {
    return false;
  }
  return !(TERMINAL_STATES.has(current.state) && next.state === 'pending');
};

export const localModuleClosure = ({ entry, readFile }) => {
  const seen = new Set();
  const pending = [normalizePath(entry)];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const source = readFile(current);
    if (source === undefined) {
      continue;
    }
    for (const specifier of relativeSpecifiers(source)) {
      pending.push(resolveFrom({ from: current, specifier }));
    }
  }
  return [...seen].toSorted((a, b) => a.localeCompare(b));
};

const normalizePath = (path) => {
  const parts = [];
  for (const segment of String(path).split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      parts.pop();
      continue;
    }
    parts.push(segment);
  }
  return parts.join('/');
};

const relativeSpecifiers = (source) =>
  [...source.matchAll(/(?:from|import)\s*(?:\(\s*)?'(\.[^']*)'/gu)].map(
    (match) => match[1],
  );

const resolveFrom = ({ from, specifier }) =>
  normalizePath(`${from.split('/').slice(0, -1).join('/')}/${specifier}`);

export const completeFileList = ({ expected, filenames }) => {
  const count = Number.parseInt(String(expected).trim(), 10);
  return filenames.length >= count ? filenames : undefined;
};

export const gateClosure = ({ driverEntry, entry, readFile }) =>
  [
    ...new Set([
      ...localModuleClosure({ entry: driverEntry, readFile }),
      ...localModuleClosure({ entry, readFile }),
    ]),
  ].toSorted((a, b) => a.localeCompare(b));

export const gateJudgesItsOwnEdit = ({ changedFiles = [], closure = [] }) => {
  const touched = new Set(changedFiles.map((file) => normalizePath(file)));
  return closure.some((module) => touched.has(module));
};

export const withheldResult = ({ changedFiles, gate, number }) => {
  if (changedFiles === undefined) {
    return {
      gate: gate.name,
      number,
      ok: false,
      output:
        'Withheld: could not read what this pull request changed, so whether it edits this gate is unknown (#884).',
    };
  }
  return gateJudgesItsOwnEdit({ changedFiles, closure: gate.closure })
    ? {
        gate: gate.name,
        number,
        ok: true,
        output:
          'Withheld: this pull request edits the code this gate runs, so the verdict would come from whichever copy this run loaded — on the schedule, the copy being replaced (#884).',
      }
    : undefined;
};

export const PROTECT_SUCCESS_FLAG = '--protect-success';

export const gateArgs = ({
  extraArgs = [],
  number,
  protectSuccess = false,
  repository,
  script,
}) => [
  script,
  '--pr',
  String(number),
  '--repo',
  repository,
  '--if-changed',
  ...(protectSuccess ? [PROTECT_SUCCESS_FLAG] : []),
  ...extraArgs,
];

const outcomeDetail = (output) => (output ? ` — ${output}` : '');

export const outcomeLine = ({ gate, number, ok, output }) =>
  `#${number} ${gate}: ${ok ? 'ok' : 'FAILED'}${outcomeDetail(output)}`;

export const sweepSummary = ({ pullRequests, results }) => {
  const failures = results.filter((result) => !result.ok);
  return {
    failures,
    text: `Reconciled ${pullRequests.length} pull request(s) over ${results.length} gate run(s); ${failures.length} failure(s).`,
  };
};
