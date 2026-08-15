/**
 * How a validated verdict is rendered for a human — the commit-status line and
 * the job summary.
 *
 * The status description is the only field an author sees without opening
 * anything, and every state that is not `pass` needs a different response. Two
 * of them share the word `error` and must not share a sentence:
 *
 *   - the **reviewer** could not conclude (§2.3), and the document says so in
 *     `error_reason` — nothing is wrong with the verdict, so an author sent to
 *     debug it is being sent to the wrong place;
 *   - the **validator** refused the document (§2.4) — unparseable, schema-
 *     breaking, or carrying an inadmissible finding.
 *
 * `errorReason` is set by the validator only for the first, so it is the
 * discriminator rather than a guess from the error list being empty.
 *
 * Both `error_reason` and every finding id are free text chosen by whoever
 * posted the comment, so anything document-derived is flattened to one line
 * before it reaches a status description, and rendered as inline code in the
 * summary — a reason spelling out its own heading otherwise renders as this
 * report's.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** GitHub truncates a commit-status description past this. */
const MAX_DESCRIPTION = 140;

/** How much of a reviewer's free-text reason the job summary reproduces. */
const MAX_SUMMARY_REASON = 600;

/**
 * §2.3's exit codes. Both kinds of `error` exit 2 — the contract's table keys on
 * the state, not on who produced it. `absent` is 0 for now: whether an
 * unreviewed pull request should be stopped is #698's decision, and this gate is
 * advisory regardless.
 */
const EXIT_CODES = { absent: 0, error: 2, fail: 1, pass: 0 };

/** (pure) */
const truncate = (text) =>
  text.length <= MAX_DESCRIPTION
    ? text
    : `${text.slice(0, MAX_DESCRIPTION - 1)}…`;

/**
 * One line, whatever came in. A status description holds a single line, and
 * this text came from a pull request comment. (pure)
 */
const oneLine = (text) => String(text).replaceAll(/\s+/gu, ' ').trim();

/**
 * Free text rendered so it cannot pass for the report's own Markdown: inline
 * code renders literally, and stripping backticks is what stops the span being
 * closed early. (pure)
 */
const asInlineCode = (text) =>
  `\`${oneLine(text).replaceAll('`', '').slice(0, MAX_SUMMARY_REASON)}\``;

/** Whether this `error` is the reviewer's conclusion rather than a rejection. */
const isReviewerError = (result) =>
  result.state === 'error' && result.errorReason !== undefined;

/** (pure) */
const passDetail = (result) => {
  const criteria = result.document?.criteria?.length ?? 0;
  const findings = result.document?.findings?.length ?? 0;
  return `${criteria} criteria evidenced, ${findings} non-blocking finding(s)`;
};

/** The one line that appears next to the check. (pure) */
export const statusDescription = (result) => {
  if (result.state === 'pass') {
    return truncate(`pass — ${passDetail(result)}`);
  }
  if (result.state === 'fail') {
    return truncate(
      `fail — blocking finding(s): ${oneLine(result.blocking.join(', '))}`,
    );
  }
  if (result.state === 'absent') {
    return truncate(`absent — ${oneLine(result.reason)}`);
  }
  if (isReviewerError(result)) {
    return truncate(
      `error — the reviewer could not review: ${oneLine(result.errorReason)}`,
    );
  }
  return truncate(
    `error — invalid verdict: ${oneLine(result.errors[0] ?? 'it does not satisfy the contract')}`,
  );
};

/** (pure) */
const summaryLines = (result) => {
  if (isReviewerError(result)) {
    return [
      'The reviewer ran and **could not reach a conclusion** (§2.3), so this',
      'commit has not been reviewed. The reason it gave:',
      '',
      `> ${asInlineCode(result.errorReason)}`,
      '',
      'The verdict document itself is valid — there is nothing to fix in it.',
      'Re-run the reviewer once the reason above no longer holds.',
    ];
  }
  if (result.state === 'error') {
    return [
      'The verdict on this pull request does not satisfy the contract, so it',
      'is not usable as one. The validator never repairs a verdict (§2.4).',
      '',
      ...result.errors.map((error) => `- ${error}`),
    ];
  }
  if (result.state === 'absent') {
    return [
      `No agent review answers for this commit — ${result.reason}.`,
      '',
      'This is **not** a failure and does not block the merge. A verdict is',
      'posted by the reviewer `/epic` and `/refactor-verified` already run.',
    ];
  }
  if (result.state === 'fail') {
    return [
      `The reviewer found ${result.blocking.length} blocking finding(s): ${result.blocking.join(', ')}.`,
      '',
      'Fix them, or override under §6 of the contract — the override is per',
      'finding, needs admin or maintain permission, and dies with the commit.',
    ];
  }
  return [`The reviewer certified this commit — ${passDetail(result)}.`];
};

/** The Markdown written to the job summary. (pure) */
export const summaryMarkdown = (result, { pr, headSha }) =>
  [
    '## Agent review verdict',
    '',
    `**State:** \`${result.state}\` — pull request #${pr}, head \`${headSha.slice(0, 7)}\``,
    '',
    ...summaryLines(result),
    '',
    ...(result.commentUrl ? [`Verdict: ${result.commentUrl}`, ''] : []),
    "Advisory during this check's measurement period — it reports, it never blocks.",
    'Contract: `docs/agents/agent-review-contract.md`.',
  ].join('\n');

/** §2.3's exit code for a state, used only under `--strict`. (pure) */
export const exitCodeFor = (state) => EXIT_CODES[state] ?? 2;
