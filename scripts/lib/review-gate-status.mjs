/**
 * The plumbing every review-gate script repeats: work out which pull request and
 * repository this run is about, then publish a commit status against the head it
 * read.
 *
 * Why it is shared rather than copied per gate: the second gate written this way
 * pushed new-code duplication over SonarCloud's threshold, which is the cheap
 * symptom. The expensive one is that each copy decides for itself which SHA a
 * status describes, and a gate that posts against a stale head reports about a
 * commit that is no longer the head — the exact failure the sweep exists to
 * correct. One definition, so that decision is made once.
 *
 * Everything here touches gh or the environment. The decisions that can be made
 * without either are in `./review-gate-reconcile.mjs`.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';
import process from 'node:process';

import { flagValue, parsePullNumber, parseRepository } from './cli-input.mjs';
import { runGh } from './gh-exec.mjs';
import {
  publishedStatus,
  shouldPublishStatus,
} from './review-gate-reconcile.mjs';

/** The Actions event payload, or `undefined` outside Actions. */
export const readEventPayload = () => {
  const path = process.env.GITHUB_EVENT_PATH;
  return path === undefined || path === ''
    ? undefined
    : JSON.parse(readFileSync(path, 'utf8'));
};

/**
 * `owner/name`, from the flag, the runner, the event, or the checkout — in that
 * order, so an explicit `--repo` always wins and a gate driven by the sweep
 * cannot resolve a different repository than the sweep listed.
 */
export const resolveRepository = (payload) =>
  parseRepository(
    flagValue('--repo') ??
      process.env.GITHUB_REPOSITORY ??
      payload?.repository?.full_name ??
      runGh([
        'repo',
        'view',
        '--json',
        'nameWithOwner',
        '--jq',
        '.nameWithOwner',
      ]),
  );

/**
 * `undefined` when nothing named a pull request — the caller prints its usage
 * for that. A value that is present but not a pull request number throws
 * instead, because `#738` would otherwise become `NaN` and reach the API path as
 * `pulls/NaN`, where a bare 404 is all anyone sees.
 */
export const resolvePullNumber = (payload) => {
  const raw = flagValue('--pr') ?? payload?.pull_request?.number;
  return raw === undefined ? undefined : parsePullNumber(raw);
};

/** The run that decided a status, so the check links to its own reasoning. */
const runUrl = () => {
  const { GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_SERVER_URL } = process.env;
  return GITHUB_RUN_ID === undefined
    ? undefined
    : `${GITHUB_SERVER_URL ?? 'https://github.com'}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
};

/** Publish one commit status against `sha`. */
export const postStatus = ({
  context,
  description,
  repository,
  sha,
  state,
}) => {
  const target = runUrl();
  runGh([
    'api',
    '--method',
    'POST',
    `repos/${repository}/statuses/${sha}`,
    '-f',
    `state=${state}`,
    '-f',
    `context=${context}`,
    '-f',
    `description=${description}`,
    ...(target === undefined ? [] : ['-f', `target_url=${target}`]),
  ]);
};

/**
 * What is published under `context` on `sha` right now, or `undefined`.
 *
 * Read against the head the caller resolved, never against an event payload's
 * SHA, so the comparison it feeds is about one commit.
 */
export const fetchPublishedStatus = ({ context, repository, sha }) =>
  publishedStatus(
    JSON.parse(
      runGh(['api', `repos/${repository}/commits/${sha}/status?per_page=100`]),
    ),
    context,
  );

/**
 * The pull request a gate run is about — `{ number, payload, repository }` — or
 * `undefined` after printing `usage`.
 *
 * Both gates open the same way, and the interesting part is the failure: a run
 * that cannot name a pull request must say so and stop, never fall through to a
 * default. Sharing it means neither gate can grow its own answer to that. The
 * payload is handed back because a gate may still need what triggered the run,
 * which is the one thing that cannot be re-read from the pull request.
 */
export const resolveGateTarget = (usage) => {
  const payload = readEventPayload();
  const number = resolvePullNumber(payload);
  if (number === undefined) {
    console.error(`${usage}\n\nGive --pr, or run inside a pull-request event.`);
    return undefined;
  }
  return { number, payload, repository: resolveRepository(payload) };
};

/**
 * Publish one gate's verdict, honouring `--if-changed` and `--dry-run`, and
 * return the line describing what became of it.
 *
 * This protocol is shared rather than written per gate because the reconcile
 * sweep depends on it being identical: it re-runs every gate on a schedule and
 * relies on `--if-changed` making a re-run a no-op. A gate that implemented that
 * check slightly differently would either republish on every sweep or stop
 * correcting a stale status, and neither is visible from the sweep's own log.
 */
export const publishGateStatus = ({
  context,
  description,
  repository,
  sha,
  state,
}) => {
  if (
    process.argv.includes('--if-changed') &&
    !shouldPublishStatus({
      current: fetchPublishedStatus({ context, repository, sha }),
      next: { description, state },
    })
  ) {
    return `Unchanged on ${sha}: nothing was posted.`;
  }
  if (process.argv.includes('--dry-run')) {
    return '--dry-run: nothing was posted.';
  }
  postStatus({ context, description, repository, sha, state });
  return `Posted to ${repository}/statuses/${sha}.`;
};
