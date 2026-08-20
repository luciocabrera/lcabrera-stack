/**
 * Builds the request body `claude-review.yml` submits to the reviews API.
 *
 * It exists so the reviewer's findings can become inline comments, which open
 * review threads, which `required_review_thread_resolution` on ruleset 19141543
 * holds the merge on. A review body alone opens no thread and holds nothing —
 * see docs/tooling/copilot-review-gate.md.
 *
 * Anchors are validated here rather than at the API, because the API rejects the
 * whole review over one bad line. Findings that cannot be anchored are moved
 * into the body instead of being dropped.
 *
 *   node scripts/build-review-payload.mjs \
 *     --body <md> --findings <json> --files <json> --commit <sha> --out <json>
 *
 * Exit 0: a payload was written. Exit 1: the body was missing or empty, which
 * means no review was produced and the caller must fail.
 *
 * Governed by .claude/rules/scripts.md.
 */

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { readTextWithin } from '../packages/repo-standards/scripts/safe-read.mjs';
import { diffIndex } from './lib/agent-review-diff.mjs';
import { reviewPayload } from './lib/review-inline-comments.mjs';

const REPO_ROOT = process.cwd();

const OPTIONS = {
  body: { type: 'string' },
  commit: { type: 'string' },
  files: { type: 'string' },
  findings: { type: 'string' },
  out: { type: 'string' },
};

/** Text from a repo-relative path, or `undefined` if it cannot be read. */
const readOptional = (path) => {
  if (typeof path !== 'string' || path === '') {
    return undefined;
  }
  try {
    return readTextWithin(path, REPO_ROOT);
  } catch {
    return undefined;
  }
};

/**
 * The findings array, or an empty one with the reason it is empty.
 *
 * Degrading here is deliberate: the prose review is already written and is worth
 * posting on its own. Failing the run because the structured half did not parse
 * would trade a whole review for its anchoring.
 */
const readFindings = (path) => {
  const text = readOptional(path);
  if (text === undefined) {
    return { findings: [], note: `no findings file was read at ${path}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      findings: [],
      note: `the findings file is not valid JSON (${error.message})`,
    };
  }
  if (!Array.isArray(parsed)) {
    return { findings: [], note: 'the findings file is not a JSON array' };
  }
  return { findings: parsed, note: undefined };
};

/** GitHub's per-file patch list, or an empty one — an unreadable diff anchors nothing. */
const readFiles = (path) => {
  const text = readOptional(path);
  if (text === undefined) {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const main = () => {
  const { values } = parseArgs({ options: OPTIONS });
  const body = readOptional(values.body);
  if (body === undefined || body.trim() === '') {
    console.error(
      '::error::No review body was produced, so there is nothing to submit. A run that reviews nothing must not report success.',
    );
    return 1;
  }

  const { findings, note } = readFindings(values.findings);
  if (note !== undefined) {
    console.log(`::warning::Posting a body-only review — ${note}.`);
  }

  const { payload, stats } = reviewPayload({
    body,
    commitSha: values.commit,
    findings,
    index: diffIndex(readFiles(values.files)),
  });

  writeFileSync(values.out, JSON.stringify(payload), 'utf8');
  console.log(
    `${stats.anchored} inline comment(s) will open a thread; ${stats.unanchored} finding(s) moved into the body.`,
  );
  return 0;
};

process.exitCode = main();
