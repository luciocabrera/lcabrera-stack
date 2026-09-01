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
 * **Everything that originates in the verdict document is untrusted text** — a
 * finding id, `error_reason`, and the validator's own messages, which quote
 * both. Two renderings, each with its own hazard:
 *
 *   - the status description is one line, so every such value goes through
 *     `oneLine`;
 *   - the job summary is Markdown, so every such value goes through
 *     `asInlineCode`. Without it a finding id carrying a newline and a `##`
 *     emits a second heading, and the report's own headings are how a reader
 *     tells the report from its subject.
 *
 * Values that do **not** come from the document are rendered as they are, and
 * the distinction is the thing to keep straight when extending this file: the
 * `absent` reason is composed here from fixed prose and a SHA the marker regex
 * already constrained to hex; `commentUrl`, `headSha` and `pr` come from the
 * API; `passDetail` is counts.
 *
 * Governed by .claude/rules/scripts.md.
 *
 * GitHub truncates a commit-status description past the length
 * `MAX_DESCRIPTION` holds.
 */

const MAX_DESCRIPTION = 140;

const MAX_SUMMARY_REASON = 600;

const EXIT_CODES = { absent: 0, error: 2, fail: 1, pass: 0 };

const truncate = (text) =>
  text.length <= MAX_DESCRIPTION
    ? text
    : `${text.slice(0, MAX_DESCRIPTION - 1)}…`;

export const oneLine = (text) => String(text).replaceAll(/\s+/gu, ' ').trim();

const asInlineCode = (text) =>
  `\`${oneLine(text).replaceAll('`', '').slice(0, MAX_SUMMARY_REASON)}\``;

const isReviewerError = (result) =>
  result.state === 'error' && result.errorReason !== undefined;

const passDetail = (result) => {
  const criteria = result.document?.criteria?.length ?? 0;
  const findings = result.document?.findings?.length ?? 0;
  return `${criteria} criteria evidenced, ${findings} non-blocking finding(s)`;
};

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
      ...result.errors.map((error) => `- ${asInlineCode(error)}`),
    ];
  }
  if (result.state === 'absent') {
    return [
      `No agent review answers for this commit — ${result.reason}.`,
      '',
      'This is **not** a failure and does not block the merge. The reviewer',
      'that produces a verdict runs under `/epic`, which posts it.',
      '`/refactor-verified` reads its own verdict in-band and posts nothing, so',
      'a pull request reviewed that way reports `absent` until one is posted.',
    ];
  }
  if (result.state === 'fail') {
    return [
      `The reviewer found ${result.blocking.length} blocking finding(s): ${result.blocking.map((id) => asInlineCode(id)).join(', ')}.`,
      '',
      'Fix them, or override under §6 of the contract — the override is per',
      'finding, needs admin or maintain permission, and dies with the commit.',
    ];
  }
  return [`The reviewer certified this commit — ${passDetail(result)}.`];
};

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

export const exitCodeFor = (state) => EXIT_CODES[state] ?? 2;
