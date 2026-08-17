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
 */

/** GitHub truncates a commit-status description past this. */
const DESCRIPTION_LIMIT = 140;

const plural = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/**
 * A suppressed comment's text quotes the diff, so every word of it is untrusted
 * and it reaches a runner's stdout. A runner reads a `::` directive at the START
 * of a line, so anything that can introduce a newline can introduce a directive;
 * denying it a line of its own is what stops that. `agent-review-report.mjs`
 * guards its own free text the same way, for the same reason.
 */
const oneLine = (text) => String(text).replaceAll(/\s+/gu, ' ').trim();

/** The location a finding is at, as a reader would paste it into an editor. */
export const findingLocation = ({ line, path }) =>
  line === undefined ? path : `${path}:${line}`;

/** The newest occurrence — Copilot's latest wording for a restated finding. */
export const latestOccurrence = (finding) =>
  finding.occurrences.at(-1) ?? { review: undefined, text: '' };

const declinedNote = ({ declined }) =>
  declined === 0
    ? ''
    : ` Copilot declined ${plural(declined, 'review')} outright, which finds nothing rather than finding nothing wrong.`;

/**
 * One line naming the state, never a bare count.
 *
 * `found` prints both numbers because they differ and the difference matters:
 * Copilot re-emits a still-open finding on every re-review, so the comment count
 * runs ahead of the number of distinct things a merger has to answer.
 */
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

/**
 * Every line ending, not just `\n`.
 *
 * Both guards below rest on transforming EVERY line, so what counts as a line is
 * the load-bearing part of each. CommonMark ends a line at `\n`, `\r\n` or a
 * bare `\r`, and .NET's line readers — which is what parses a runner's stdout —
 * do the same; `split('\n')` does not. A line ending that is not split on is a
 * line that is not transformed, and its remainder arrives at column zero, which
 * is the fenced-block defect one layer down. Verified against GitHub's own
 * renderer (`POST /markdown`, `mode: gfm`), which turned an unsplit bare `\r`
 * into a checked task item.
 */
const LINE_ENDING = /\r\n|[\n\r]/u;

const sourceLines = (snippet) => snippet.split(LINE_ENDING);

/**
 * The source Copilot quoted, for the terminal: one line each behind a `|`.
 *
 * The prefix is not decoration. This text is untrusted and reaches a runner's
 * stdout, a snippet is the one thing here that must keep its line breaks, and
 * the runner matches a `::` directive on the TRIMMED line — so indentation
 * alone would not stop `::error::` in quoted source from being obeyed, and a
 * visible first character does.
 */
const snippetLines = (snippet) =>
  snippet === undefined
    ? []
    : sourceLines(snippet).map((line) => `    | ${line}`);

/**
 * Two spaces for the list item's content column, four more for the code block.
 * The width is what makes an indented block an indented block, so it is not a
 * setting to taste.
 */
export const SUMMARY_INDENT = '      ';

/**
 * The same source for the job summary, as an **indented** code block.
 *
 * Not a fenced one, and not a longer fence: a fence closes on any line carrying
 * at least as many backticks, so quoted source can end it and everything after
 * escapes as Markdown. That is a checked `- [x]` line landing among the
 * findings, in a checklist whose whole meaning is that an unchecked box is an
 * unanswered finding. No fence width fixes it, because the input chooses the
 * width.
 *
 * An indented block has no closing delimiter to imitate: it ends at a line that
 * is not indented, and every line here is indented by this function. That is the
 * same shape as the terminal renderer's per-line prefix, for the same reason —
 * transform every line, and no line can be special.
 */
const snippetBlock = (snippet) =>
  snippet === undefined
    ? []
    : [
        '',
        ...sourceLines(snippet).map((line) => `${SUMMARY_INDENT}${line}`),
        '',
      ];

/** Every finding, newest wording first, one block of lines each. */
const findingLines = (report) =>
  report.findings.flatMap((finding) => {
    const latest = latestOccurrence(finding);
    const restated =
      finding.occurrences.length > 1
        ? ` (restated ${plural(finding.occurrences.length, 'time')})`
        : '';
    return [
      `  ${findingLocation(finding)}${restated} — review ${latest.review}`,
      `    ${oneLine(latest.text)}`,
      ...snippetLines(latest.snippet),
    ];
  });

/** The whole report as terminal lines, headline included. */
export const suppressedLines = (report, options = {}) => [
  suppressedHeadline(report, options),
  ...report.problems.map((problem) => `  ! ${oneLine(problem)}`),
  ...findingLines(report),
];

/**
 * The same report as a job summary.
 *
 * Every finding is a checkbox, because the state this closes is a merger who
 * cannot tell which findings they have already answered — the thing a review
 * thread gives them for free and a suppressed comment does not.
 */
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

/**
 * The clause the commit status carries, or `undefined` when there is nothing to
 * add. Absent for a clean read on purpose: a description that gains a note only
 * when something is there is one a reader can skim.
 */
export const suppressedStatusNote = (report) => {
  if (report.state === 'unreadable') {
    return 'Suppressed comments unreadable — run copilot-review:suppressed.';
  }
  return report.state === 'found'
    ? `${plural(report.findings.length, 'suppressed finding')} — run copilot-review:suppressed.`
    : undefined;
};

/**
 * The gate's verdict with that clause appended, within GitHub's limit.
 *
 * Over the limit the whole string is cut rather than the note dropped: a note
 * that disappears when the verdict runs long is the silent zero again, in the
 * one place a merger actually looks.
 */
export const withStatusNote = (description, note) => {
  if (note === undefined || note === '') {
    return description;
  }
  const joined = `${description} ${note}`;
  return joined.length <= DESCRIPTION_LIMIT
    ? joined
    : `${joined.slice(0, DESCRIPTION_LIMIT - 1)}…`;
};
