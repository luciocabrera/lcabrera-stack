/**
 * Lists the review findings Copilot suppressed on one pull request.
 *
 * Why it exists: conversation resolution — the only thing that forces a Copilot
 * finding to be answered before a merge — sees review threads, and a suppressed
 * comment never becomes one. Reading them meant opening every review body by
 * hand, so in practice nobody did, and #740 merged with unanswered findings in
 * it. This is the same read, run for you.
 *
 * It reports; it never blocks a merge — the reasoning is ADR-078, and how to
 * read each state is docs/tooling/copilot-review-gate.md.
 *
 * Usage (from the repo root):
 *   vp run copilot-review:suppressed -- --pr <number> [--repo <owner/name>]
 *
 * Exit codes: 0 = the reviews were read and the answer is in the output, which
 * includes "none"; 1 = the pull request could not be read, or the bodies could
 * not be parsed — an unreadable review is reported as unreadable and never as
 * zero suppressed comments.
 */
import process from 'node:process';

import {
  flagValue,
  parsePullNumber,
  parseRepository,
} from '../packages/repo-standards/scripts/cli-input.mjs';
import { fetchPullRequestReviews } from './lib/copilot-reviews-api.mjs';
import { suppressedLines } from './lib/copilot-suppressed-report.mjs';
import { collectSuppressedComments } from './lib/copilot-suppressed.mjs';
import { errorMessage } from './lib/error-message.mjs';
import { runGh } from './lib/gh-exec.mjs';

const USAGE =
  'usage: node scripts/copilot-suppressed-comments.mjs --pr <number> ' +
  '[--repo <owner/name>]';

const resolveRepository = () =>
  parseRepository(
    flagValue('--repo') ??
      process.env.GITHUB_REPOSITORY ??
      runGh([
        'repo',
        'view',
        '--json',
        'nameWithOwner',
        '--jq',
        '.nameWithOwner',
      ]),
  );

const main = () => {
  const raw = flagValue('--pr') ?? process.env.PR_NUMBER;
  if (raw === undefined || String(raw).trim() === '') {
    console.error(`${USAGE}\n\nGive --pr, or set PR_NUMBER.`);
    process.exitCode = 1;
    return;
  }
  const number = parsePullNumber(raw);
  const repository = resolveRepository();
  const report = collectSuppressedComments(
    fetchPullRequestReviews(repository, number),
  );

  for (const line of suppressedLines(report, { pr: number })) {
    console.log(line);
  }
  if (report.state === 'unreadable') {
    process.exitCode = 1;
  }
};

try {
  main();
} catch (error) {
  console.error(`copilot-review:suppressed: ${errorMessage(error)}`);
  process.exitCode = 1;
}
