import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

// A job's check run and a commit status share ONE namespace on a pull request,
// and ruleset contexts match by name. So a job named after the status the gate
// publishes puts a second row under that name — green because the workflow ran,
// not because a verdict validated — and the context #698 promotes could be
// satisfied by "the workflow executed".
//
// This is asserted rather than left to review because it is invisible in the
// YAML: both spellings look correct in isolation, and the collision only shows
// up in the pull request's check list. The sibling gate
// (.github/workflows/copilot-review-gate.yml) carries the same warning as a
// comment; a comment is what failed to prevent this one.
//
// The two strings are read from their own files rather than restated here, so
// renaming either side is what this test sees.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const WORKFLOW = '.github/workflows/agent-review-verdict.yml';
const GATE_SCRIPT = 'scripts/verify-agent-review.mjs';

const read = (path) => readFileSync(join(REPO_ROOT, path), 'utf8');

/**
 * The commit-status context the gate publishes, taken from its one definition.
 * Asserted rather than defaulted: a restructured script must fail loudly here
 * instead of quietly comparing against an empty string, which would pass every
 * assertion below while checking nothing.
 */
const statusContext = () => {
  const source = read(GATE_SCRIPT);
  const marker = "const STATUS_CONTEXT = '";
  const start = source.indexOf(marker);
  expect(
    start,
    `could not find STATUS_CONTEXT in ${GATE_SCRIPT} — if it moved, re-anchor this test`,
  ).toBeGreaterThan(-1);
  const rest = source.slice(start + marker.length);
  return rest.slice(0, rest.indexOf("'"));
};

/** Every `name:` the workflow declares — workflow, job and step alike. */
const declaredNames = () =>
  [...read(WORKFLOW).matchAll(/^[ \t]*name:[ \t]*(.+)$/gm)].map((match) =>
    match[1].trim(),
  );

/**
 * The workflow's comments as running prose. Read this way, not line by line: a
 * YAML comment wraps wherever it must, so matching the raw text would pin the
 * line breaks rather than what they say.
 */
const commentProse = () =>
  read(WORKFLOW)
    .replaceAll(/^[ \t]*#[ \t]?/gm, '')
    .replaceAll(/\s+/gu, ' ');

describe('the agent-review workflow', () => {
  it('publishes a status context that is not empty', () => {
    expect(statusContext()).toBe('Agent review verdict');
  });

  it('declares names at all, so the assertions below are not vacuous', () => {
    expect(declaredNames().length).toBeGreaterThan(1);
  });

  it('names no job after the status context it publishes', () => {
    // Otherwise the pull request shows two rows under one name, one of which is
    // green whenever the workflow ran — see the header.
    expect(declaredNames()).not.toContain(statusContext());
  });

  it('carries the warning, since #698 will read this file', () => {
    expect(commentProse()).toMatch(/ruleset contexts match by name/i);
  });
});

describe('the gate script — every line it prints', () => {
  // A runner reads a `::` directive at the START of a log line, so any value
  // that can introduce a newline can introduce a directive. Every value this
  // gate prints is untrusted: the validator's messages quote the verdict
  // document, and a caught error carries `gh`'s stderr.
  //
  // Asserted at the source rather than per call site, because the defect this
  // encodes was a MISSED site — flattening went onto the success path while the
  // `catch` kept its raw interpolation. A test naming the sites that existed
  // would have passed then too; this one fails on a site that is added.
  it('writes only through the flattening helpers', () => {
    const rawWrites = [
      ...read(GATE_SCRIPT).matchAll(/console\.(?:log|error)\([ \t]*([^\n]*)/g),
    ]
      .map((match) => match[1].trim())
      .filter((argument) => !argument.startsWith('oneLine('));
    expect(rawWrites).toEqual([]);
  });

  it('writes at all, so the assertion above is not vacuous', () => {
    expect(read(GATE_SCRIPT)).toMatch(/console\.(?:log|error)\(/);
  });
});

describe('the agent-review workflow — what it deliberately does not do', () => {
  // An absence is the hardest thing to keep. A comment explaining why something
  // is missing is exactly what a later refactor removes in good faith, and
  // "add a concurrency group" is a plausible tidy-up that would reintroduce the
  // failure it was removed for.
  it('cancels no run that would publish a status', () => {
    // Cancelling would leave the cancelled event with no status at all, and the
    // `issue_comment` run this gate depends on most is bot-triggered — the class
    // that goes missing in this repository (#698 carries the measurement).
    //
    // The hazard is cancellation, not grouping: a group that queues still lets
    // every event's run publish. Pinning `cancel-in-progress` rather than
    // `concurrency:` keeps a future non-cancelling group from failing falsely.
    expect(read(WORKFLOW)).not.toMatch(/cancel-in-progress:[ \t]*true/);
  });

  it('says why the group is absent, so the absence survives a refactor', () => {
    expect(commentProse()).toMatch(/no concurrency group/i);
  });
});
