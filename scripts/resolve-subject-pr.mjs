#!/usr/bin/env node
/**
 * Exports the pull request a CI run answers for into `$GITHUB_ENV`, for a
 * `merge_group` build as well as a `pull_request` one.
 *
 * Why it exists: inside a merge queue there is no `github.event.pull_request`,
 * so the gates that read a branch name, a title, a body or a commit range from
 * it read empty and pass having checked nothing. This resolves the same facts
 * from the merge group's own ref and refuses to continue when it cannot — a gate
 * that cannot name its subject must fail, not fall back.
 *
 * Writes `BRANCH_NAME`, `PR_TITLE`, `PR_BODY`, `PR_BASE`, `PR_NUMBER`,
 * `PR_HEAD_SHA`, `PR_IS_FORK`, `RANGE_BASE_SHA` and `RANGE_HEAD_SHA`. The
 * decisions are `packages/repo-standards/scripts/merge-queue.mjs`; the queue itself is
 * `docs/tooling/merge-queue.md`.
 *
 * `PR_IS_FORK` says where the pull request came from. It does NOT say whether
 * this run has the repository's secrets: a merge-queue build runs on a branch
 * of this repository and gets them all, even for a queued fork pull request.
 *
 * Usage (in a workflow step, with GH_TOKEN set):
 *   node scripts/resolve-subject-pr.mjs
 *
 * Exit codes: 0 = the environment was written, 1 = no pull request could be
 * resolved, its commit range spans no commit, or it could not be read.
 */
import { randomUUID } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import process from 'node:process';

import { errorMessage } from '../packages/repo-standards/scripts/error-message.mjs';
import { runGh } from '../packages/repo-standards/scripts/gh-exec.mjs';
import {
  envBlock,
  subjectEnv,
  subjectRequest,
} from '../packages/repo-standards/scripts/merge-queue.mjs';

const readEventPayload = () => {
  const path = process.env.GITHUB_EVENT_PATH;
  return path === undefined || path === ''
    ? undefined
    : JSON.parse(readFileSync(path, 'utf8'));
};

const fetchPullRequest = (repository, number) =>
  JSON.parse(runGh(['api', `repos/${repository}/pulls/${number}`]));

const write = (values) => {
  const path = process.env.GITHUB_ENV;
  const text = envBlock(values, `SUBJECT_${randomUUID()}`);
  if (path === undefined || path === '') {
    process.stdout.write(text);
    return;
  }
  appendFileSync(path, text, 'utf8');
};

const main = () => {
  const repository = process.env.GITHUB_REPOSITORY ?? '';
  const request = subjectRequest({
    eventName: process.env.GITHUB_EVENT_NAME,
    payload: readEventPayload(),
  });
  if (request.error !== undefined) {
    process.stderr.write(
      `resolve-subject-pr: ${request.error}.\nRefusing to continue: a gate that cannot name its subject, or the range it must read, would check nothing and report green.\n`,
    );
    process.exitCode = 1;
    return;
  }

  const pullRequest =
    request.pullRequest ?? fetchPullRequest(repository, request.number);
  const values = subjectEnv({
    pullRequest,
    range: request.range,
    repository,
  });
  write(values);
  process.stdout.write(
    `This run answers for #${values.PR_NUMBER} (${values.BRANCH_NAME} → ${values.PR_BASE}), head ${values.PR_HEAD_SHA}.\n` +
      `Commit range: ${values.RANGE_BASE_SHA}..${values.RANGE_HEAD_SHA}\n`,
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`resolve-subject-pr: ${errorMessage(error)}\n`);
  process.exitCode = 1;
}
