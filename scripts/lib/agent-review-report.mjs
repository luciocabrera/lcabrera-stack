/**
 * How a validated verdict is rendered for a human — the commit-status line and
 * the job summary.
 *
 * The status description is the only field an author sees without opening
 * anything, and `error`, `fail` and `absent` all eventually mean "not a pass"
 * while needing completely different responses: the reviewer could not run, the
 * reviewer found a blocking defect, or no reviewer ran at all. So the state is
 * spelled out there rather than encoded in a colour.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** GitHub truncates a commit-status description past this. */
const MAX_DESCRIPTION = 140;

/**
 * §2.3's exit codes. `absent` is 0 for now: whether an unreviewed pull request
 * should be stopped is #698's decision, and this gate is advisory regardless.
 */
const EXIT_CODES = { absent: 0, error: 2, fail: 1, pass: 0 };

/** (pure) */
const truncate = (text) =>
  text.length <= MAX_DESCRIPTION
    ? text
    : `${text.slice(0, MAX_DESCRIPTION - 1)}…`;

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
      `fail — blocking finding(s): ${result.blocking.join(', ')}`,
    );
  }
  if (result.state === 'absent') {
    return truncate(`absent — ${result.reason}`);
  }
  return truncate(`error — ${result.errors[0] ?? 'the verdict is not valid'}`);
};

/** (pure) */
const summaryLines = (result) => {
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
