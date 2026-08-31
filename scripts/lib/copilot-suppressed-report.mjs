/**
 * Renders what `./copilot-suppressed.mjs` read, for the three places a merger
 * meets it: the terminal, a run's job summary, and the commit-status
 * description the `Copilot review complete` gate publishes.
 *
 * Kept apart from the parsing so the wording can change without touching the
 * thing that decides whether a zero is an answer. Every renderer here says which
 * of the four states it is describing — "0" on its own is exactly the output
 * this feature exists to stop being believed.
 *
 * Governed by .claude/rules/scripts.md.
 *
 * GitHub truncates a commit-status description past the length
 * `DESCRIPTION_LIMIT` holds.
 */

const DESCRIPTION_LIMIT = 140;

const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const oneLine = (text) => String(text).replaceAll(/\s+/gu, ' ').trim();

export const MARKERS = {
  finding: '- ',
  problem: '! ',
  prose: '> ',
  source: '| ',
};

export const findingLocation = ({ line, path }) =>
  oneLine(line === undefined ? path : `${path}:${line}`);

export const latestOccurrence = (finding) =>
  finding.occurrences.at(-1) ?? { review: undefined, text: '' };

const declinedNote = ({ declined }) =>
  declined === 0
    ? ''
    : ` Copilot declined ${plural(declined, 'review')} outright, which finds nothing rather than finding nothing wrong.`;

export const suppressedHeadline = (report, { pr } = {}) => {
  const at = pr === undefined ? 'this pull request' : `#${pr}`;
  const reviews = plural(report.reviewsRead, 'Copilot review');
  if (report.state === 'unreadable') {
    return `${at}: Copilot's suppressed comments could NOT be read — ${plural(report.problems.length, 'problem')} below. Treat any count here as unknown, not as zero.`;
  }
  if (report.state === 'no-reviews') {
    return `${at}: no Copilot review to read, so nothing can be said about suppressed comments yet.`;
  }
  if (report.state === 'none') {
    return `${at}: no suppressed comments in ${reviews}.${declinedNote(report)}`;
  }
  return `${at}: ${plural(report.findings.length, 'suppressed finding')} from ${plural(report.comments.length, 'comment')} in ${plural(report.blocks, 'block')} of ${reviews}.${declinedNote(report)}`;
};

const LINE_ENDING = /\r\n|[\n\r]/u;

const sourceLines = (snippet) => snippet.split(LINE_ENDING);

const snippetLines = (snippet) =>
  snippet === undefined
    ? []
    : sourceLines(snippet).map((line) => `    ${MARKERS.source}${line}`);

export const SUMMARY_INDENT = '      ';

const snippetBlock = (snippet) =>
  snippet === undefined
    ? []
    : [
        '',
        ...sourceLines(snippet).map((line) => `${SUMMARY_INDENT}${line}`),
        '',
      ];

const findingLines = (report) =>
  report.findings.flatMap((finding) => {
    const latest = latestOccurrence(finding);
    const restated =
      finding.occurrences.length > 1
        ? ` (restated ${plural(finding.occurrences.length, 'time')})`
        : '';
    return [
      `  ${MARKERS.finding}${findingLocation(finding)}${restated} — review ${oneLine(latest.review)}`,
      `    ${MARKERS.prose}${oneLine(latest.text)}`,
      ...snippetLines(latest.snippet),
    ];
  });

export const suppressedLines = (report, options = {}) => [
  suppressedHeadline(report, options),
  ...report.problems.map(
    (problem) => `  ${MARKERS.problem}${oneLine(problem)}`,
  ),
  ...findingLines(report),
];

export const suppressedMarkdown = (report, options = {}) => {
  const problems = report.problems.map((problem) => `- ⚠ ${oneLine(problem)}`);
  const findings = report.findings.flatMap((finding) => {
    const latest = latestOccurrence(finding);
    return [
      `- [ ] \`${findingLocation(finding)}\` — ${oneLine(latest.text)}`,
      ...snippetBlock(latest.snippet),
    ];
  });
  return [
    '### Copilot suppressed comments',
    '',
    suppressedHeadline(report, options),
    ...(problems.length > 0 ? ['', ...problems] : []),
    ...(findings.length > 0 ? ['', ...findings] : []),
    '',
    'These are review findings Copilot filed in the review body rather than as threads, so conversation resolution never sees them. They do not block the merge — see docs/tooling/copilot-review-gate.md.',
  ].join('\n');
};

export const suppressedStatusNote = (report) => {
  if (report.state === 'unreadable') {
    return 'Suppressed comments unreadable — run copilot-review:suppressed.';
  }
  return report.state === 'found'
    ? `${plural(report.findings.length, 'suppressed finding')} — run copilot-review:suppressed.`
    : undefined;
};

export const withStatusNote = (description, note) => {
  if (note === undefined || note === '') {
    return description;
  }
  const joined = `${description} ${note}`;
  return joined.length <= DESCRIPTION_LIMIT
    ? joined
    : `${joined.slice(0, DESCRIPTION_LIMIT - 1)}…`;
};
