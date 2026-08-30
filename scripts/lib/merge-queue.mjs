/**
 * Which pull request a workflow run answers for, and which commit range it
 * validates — for a `merge_group` build as well as a `pull_request` one.
 *
 * Why it exists: a merge queue dispatches `merge_group`, and that payload carries
 * no `pull_request` object at all, so every gate written against
 * `github.event.pull_request` reads empty inside the queue and reports on
 * nothing while still reporting green. The queue branch's ref is the only thing
 * in the payload that names the pull request.
 *
 * What the exported values mean, why the range is the merge group's PARENT
 * commit, and why the environment is written as heredocs, are in
 * `docs/tooling/merge-queue.md`; the decision is ADR-097.
 *
 * Pure: the event payload arrives as an argument. The `gh` read and the
 * `$GITHUB_ENV` write live in `scripts/resolve-subject-pr.mjs`.
 *
 * Governed by .claude/rules/scripts.md.
 */

const QUEUE_ENTRY = /\/pr-(\d+)-[0-9a-f]{7,40}$/u;
const QUEUE_PREFIX = 'refs/heads/gh-readonly-queue/';

export const pullNumberFromQueueRef = (ref) => {
  if (typeof ref !== 'string' || !ref.startsWith(QUEUE_PREFIX)) {
    return undefined;
  }
  const match = QUEUE_ENTRY.exec(ref);
  return match === null ? undefined : Number(match[1]);
};

export const subjectRequest = ({ eventName, payload }) => {
  if (eventName === 'pull_request' || eventName === 'pull_request_target') {
    const pullRequest = payload?.pull_request;
    return pullRequest === undefined
      ? { error: 'the pull_request payload carries no pull request' }
      : {
          number: pullRequest.number,
          pullRequest,
          range: {
            baseSha: pullRequest.base?.sha ?? '',
            headSha: pullRequest.head?.sha ?? '',
          },
        };
  }
  if (eventName !== 'merge_group') {
    return {
      error: `no pull request can be resolved from a \`${eventName ?? 'unknown'}\` event`,
    };
  }
  const group = payload?.merge_group;
  const number = pullNumberFromQueueRef(group?.head_ref);
  return number === undefined
    ? {
        error: `the merge group ref \`${group?.head_ref ?? '(absent)'}\` names no pull request`,
      }
    : {
        number,
        range: { baseSha: group.base_sha, headSha: group.head_sha },
      };
};

export const statusSha = ({ eventName, payload }) =>
  eventName === 'merge_group' ? payload?.merge_group?.head_sha : undefined;

export const subjectEnv = ({ pullRequest, range, repository }) => ({
  BRANCH_NAME: pullRequest.head?.ref ?? '',
  PR_BASE: pullRequest.base?.ref ?? '',
  PR_BODY: pullRequest.body ?? '',
  PR_HEAD_SHA: pullRequest.head?.sha ?? '',
  PR_IS_FORK: String(
    (pullRequest.head?.repo?.full_name ?? repository) !== repository,
  ),
  PR_NUMBER: String(pullRequest.number),
  PR_TITLE: pullRequest.title ?? '',
  RANGE_BASE_SHA: range.baseSha ?? '',
  RANGE_HEAD_SHA: range.headSha ?? '',
});

export const envBlock = (values, delimiter) =>
  Object.entries(values)
    .map(([key, value]) => {
      if (value.includes(delimiter)) {
        throw new Error(
          `${key} contains the heredoc delimiter — refusing to write it`,
        );
      }
      return `${key}<<${delimiter}\n${value}\n${delimiter}\n`;
    })
    .join('');
