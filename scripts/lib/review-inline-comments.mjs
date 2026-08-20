/**
 * Which reviewer findings can be submitted as inline comments, and what happens
 * to the rest.
 *
 * The reviews API rejects a comment whose line is not part of the diff, and it
 * rejects the **whole review** rather than the offending comment — so one
 * mis-anchored finding would lose every other finding submitted with it, and
 * `claude-review.yml`'s "a run that reviews nothing must fail" guard would then
 * report a red check on a pull request that was reviewed correctly. Anchors are
 * therefore validated here, before submission, rather than discovered by a 422.
 *
 * A finding that cannot be anchored is not dropped. It is rendered into the
 * review body with the reason, because a finding nobody sees is worse than one
 * that does not block.
 *
 * Anchoring itself is `agent-review-diff.mjs`, which the verdict contract
 * already uses for the same question.
 *
 * Governed by .claude/rules/scripts.md.
 */

import { isAddedLine } from './agent-review-diff.mjs';

/** GitHub rejects a review carrying more than this many comments. */
const MAX_INLINE_COMMENTS = 100;

const isFilledString = (value) =>
  typeof value === 'string' && value.trim() !== '';

/**
 * Why this finding cannot become an inline comment, or `undefined` if it can.
 *
 * Order matters: a shape problem is reported as a shape problem even when the
 * file is also unreadable, because the two need different fixes. (pure)
 */
const anchorRefusal = (finding, index) => {
  if (finding === null || typeof finding !== 'object') {
    return 'the finding is not an object';
  }
  if (!isFilledString(finding.path)) {
    return 'it names no file';
  }
  if (!isFilledString(finding.body)) {
    return 'it carries no comment text';
  }
  if (!Number.isInteger(finding.line) || finding.line < 1) {
    return `it names no line in \`${finding.path}\``;
  }
  if (index.unreadable.has(finding.path)) {
    return `GitHub withheld the patch for \`${finding.path}\`, so the line could not be confirmed`;
  }
  if (!isAddedLine(index, finding.path, finding.line)) {
    return `\`${finding.path}\` line ${finding.line} is not a line this diff added`;
  }
  return undefined;
};

/**
 * Split findings into the ones that can be posted inline and the ones that
 * cannot, each of the latter carrying why.
 *
 * Anything past `MAX_INLINE_COMMENTS` is moved to the body rather than silently
 * cut: the API would reject the submission, and a truncation nobody is told
 * about reads exactly like a review that found less. (pure)
 */
export const partitionFindings = (findings, index) => {
  const anchored = [];
  const unanchored = [];
  for (const finding of Array.isArray(findings) ? findings : []) {
    const refusal = anchorRefusal(finding, index);
    if (refusal !== undefined) {
      unanchored.push({ finding, reason: refusal });
    } else if (anchored.length >= MAX_INLINE_COMMENTS) {
      unanchored.push({
        finding,
        reason: `this review already carries ${MAX_INLINE_COMMENTS} inline comments, the most the API accepts`,
      });
    } else {
      anchored.push({
        body: finding.body,
        line: finding.line,
        path: finding.path,
        side: 'RIGHT',
      });
    }
  }
  return { anchored, unanchored };
};

/** Where a finding pointed, as much of it as the finding actually gave. (pure) */
const findingLocation = (finding) => {
  if (!isFilledString(finding?.path)) {
    return 'an unnamed location';
  }
  if (!Number.isInteger(finding?.line)) {
    return `\`${finding.path}\``;
  }
  return `\`${finding.path}\` line ${finding.line}`;
};

/** One unanchored finding, rendered so a reader can still act on it. (pure) */
const renderUnanchored = ({ finding, reason }, position) => {
  const where = findingLocation(finding);
  const text = isFilledString(finding?.body)
    ? finding.body
    : '_(this finding carried no text)_';
  return `${position}. **${where}** — not posted inline because ${reason}.\n\n${text}`;
};

/**
 * The review body, with any unanchored findings appended under a heading.
 *
 * The heading says these do not block, because the reader's next question after
 * seeing a finding is whether it is holding the merge, and the answer differs
 * from the inline ones on the same review. (pure)
 */
export const bodyWithUnanchored = (body, unanchored) => {
  if (unanchored.length === 0) {
    return body;
  }
  const rendered = unanchored
    .map((entry, position) => renderUnanchored(entry, position + 1))
    .join('\n\n');
  return `${body.trimEnd()}

---

### Findings that could not be anchored to the diff

These are **not** inline comments, so they open no thread and hold no merge. Each
one says why it could not be placed.

${rendered}`;
};

/**
 * A degraded run, said on the pull request rather than only in the job log.
 *
 * It leads the body because it changes how everything under it should be read:
 * without it, a review whose findings file was lost is a summary paragraph and
 * nothing else, which is indistinguishable from a reviewer that found nothing.
 * The body no longer carries a prose copy of the findings to fall back on — the
 * prompt reserves it for what did *not* become a finding — so the log is the
 * only other place this appears, and a log is not where a reader looks. (pure)
 */
export const bodyWithNote = (body, note) =>
  note === undefined
    ? body
    : `> **Note:** the findings file could not be read — ${note}. Any findings this review made are missing from it; the summary below is all that survived.

${body}`;

/**
 * The whole request body for `POST /repos/{owner}/{repo}/pulls/{n}/reviews`.
 *
 * `event` stays `COMMENT`: this reviewer does not approve and must not request
 * changes, because `REQUEST_CHANGES` blocks on the reviewer withdrawing it and
 * a workflow has no way to. Threads are what hold the merge, via the ruleset's
 * `required_review_thread_resolution`. (pure)
 */
export const reviewPayload = ({ body, commitSha, findings, index, note }) => {
  const { anchored, unanchored } = partitionFindings(findings, index);
  return {
    payload: {
      body: bodyWithNote(bodyWithUnanchored(body, unanchored), note),
      comments: anchored,
      commit_id: commitSha,
      event: 'COMMENT',
    },
    stats: { anchored: anchored.length, unanchored: unanchored.length },
  };
};
