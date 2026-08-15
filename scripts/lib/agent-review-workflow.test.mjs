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
    // Read as prose, not as lines: a YAML comment wraps wherever it must, so
    // matching raw text would pin the line breaks rather than the warning.
    const prose = read(WORKFLOW)
      .replaceAll(/^[ \t]*#[ \t]?/gm, '')
      .replaceAll(/\s+/gu, ' ');
    expect(prose).toMatch(/ruleset contexts match by name/i);
  });
});
