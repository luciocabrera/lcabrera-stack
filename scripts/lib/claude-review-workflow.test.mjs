import { describe, expect, it } from 'vite-plus/test';

import { readRepoFile, stepBlock, stepEnvValue } from './workflow-inspect.mjs';

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
//
// The credential is read POSITIVELY, per key, rather than asserted absent over the
// step's text. `stepBlock` runs to the next `- name:`, so the submit step's text
// includes the comment block introducing the dispatch step — and a sentence there
// mentioning `github.token` would fail a negative assertion for a reason that has
// nothing to do with which token is used. See `stepEnvValue`.
const WORKFLOW = '.github/workflows/claude-review.yml';
const SUBMIT_STEP =
  'Submit the review against the head this run was triggered for';
const MINT_STEP = "Mint a token for the reviewer's own identity";
const DISPATCH_STEP =
  'Ask the review gate to recompute now rather than at the next sweep';

describe('the review is posted under the reviewer’s own identity', () => {
  it('submits with the App installation token, not the default GITHUB_TOKEN', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), SUBMIT_STEP);
    expect(step).toBeDefined();
    // The whole point: a fallback here silently unmatches every review.
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(
      '${{ steps.reviewer-token.outputs.token }}',
    );
  });

  it('mints that token from the App rather than hardcoding a login', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), MINT_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('actions/create-github-app-token');
    expect(step).toContain('secrets.REVIEWER_APP_ID');
    expect(step).toContain('secrets.REVIEWER_APP_PRIVATE_KEY');
    expect(step).toContain('id: reviewer-token');
  });

  // `stepEnvValue`'s own two claims, since the assertions above rest on them and this
  // file is its only caller. Both are the difference between reading the credential
  // and reading prose about it.
  it('reads env keys past comment lines, and reports an absent key as undefined', () => {
    const step = [
      '      - name: Example',
      '        # GH_TOKEN: ${{ github.token }} — a comment, not the setting',
      '        env:',
      '          GH_TOKEN: ${{ steps.reviewer-token.outputs.token }}',
    ].join('\n');
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(
      '${{ steps.reviewer-token.outputs.token }}',
    );
    expect(stepEnvValue(step, 'NOT_SET')).toBeUndefined();
  });

  // The dispatch legitimately keeps `github.token` — it needs `actions: write`,
  // which the App does not hold. Asserted so the assertion above is not read as
  // "this workflow must never use github.token".
  it('leaves the gate dispatch on github.token, which the App cannot replace', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), DISPATCH_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe('${{ github.token }}');
  });

  // `gh workflow run` with no `--ref` runs the DEFAULT BRANCH's copy of the gate,
  // so a pull request that edits the gate gets judged by the code it is replacing.
  // On #866 that overwrote a correct `success` with `pending` three seconds later.
  // Nothing else here would notice: the dispatch succeeds, the run is green, and
  // only the published status is wrong.
  it('dispatches the gate against the pull request’s own ref', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), DISPATCH_STEP);
    expect(step).toContain('--ref "$HEAD_REF"');
    expect(step).toContain(
      'HEAD_REF: ${{ github.event.pull_request.head.ref }}',
    );
  });
});
