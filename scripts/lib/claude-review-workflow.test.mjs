import { describe, expect, it } from 'vite-plus/test';

import { readRepoFile, stepBlock } from './workflow-inspect.mjs';

// `ACCEPTED_REVIEWERS` names the reviewer by login, and the login follows from the
// credential the review is posted with. The unit tests around that set prove the
// SET is right; nothing there can see which token the workflow actually uses.
//
// That gap has a specific failure mode, and it is the quiet one. If the submit step
// fell back to `github.token`, the review would be authored by `github-actions[bot]`
// again — which the set no longer accepts — so every review would stop matching and
// the status would sit at `pending` forever. Green build, green tests, and a gate
// that never goes green for a reason nothing reports. AGENTS.md Rule 14: a clean
// pass has to be evidence, and the reviewer-set tests pass identically either way.
//
// So this reads the workflow. The comment on that test used to claim it covered
// this case; it did not, and a comment promising a check that does not exist is
// worse than no comment (#866 review).
const WORKFLOW = '.github/workflows/claude-review.yml';
const SUBMIT_STEP =
  'Submit the review against the head this run was triggered for';
const MINT_STEP = "Mint a token for the reviewer's own identity";

describe('the review is posted under the reviewer’s own identity', () => {
  it('submits with the App installation token, not the default GITHUB_TOKEN', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), SUBMIT_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('steps.reviewer-token.outputs.token');
    // The whole point: a fallback here silently unmatches every review.
    expect(step).not.toContain('github.token');
  });

  it('mints that token from the App rather than hardcoding a login', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), MINT_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('actions/create-github-app-token');
    expect(step).toContain('secrets.REVIEWER_APP_ID');
    expect(step).toContain('secrets.REVIEWER_APP_PRIVATE_KEY');
    expect(step).toContain('id: reviewer-token');
  });

  // The dispatch legitimately keeps `github.token` — it needs `actions: write`,
  // which the App does not hold. Asserted so the step above's `not.toContain` is
  // not read as "this workflow must never use github.token".
  it('leaves the gate dispatch on github.token, which the App cannot replace', () => {
    const step = stepBlock(
      readRepoFile(WORKFLOW),
      'Ask the review gate to recompute now rather than at the next sweep',
    );
    expect(step).toBeDefined();
    expect(step).toContain('github.token');
  });
});
