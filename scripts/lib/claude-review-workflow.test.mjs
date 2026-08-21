import { describe, expect, it } from 'vite-plus/test';

import { readRepoFile, stepBlock, stepEnvValue } from './workflow-inspect.mjs';

// The reviewer's login follows from the credential the review is posted with, so a
// submit step that fell back to `github.token` would author every review as
// `github-actions[bot]` — which `ACCEPTED_REVIEWERS` no longer accepts — and the gate
// would sit at `pending` forever with a green build. The reviewer-set unit tests pass
// identically either way, so this reads the workflow instead (#866, AGENTS.md Rule 14).
//
// The credential is read per env key rather than asserted absent over the step's text;
// `stepEnvValue` carries why.
const WORKFLOW = '.github/workflows/claude-review.yml';
const SUBMIT_STEP =
  'Submit the review against the head this run was triggered for';
const MINT_STEP = "Mint a token for the reviewer's own identity";
const DISPATCH_STEP =
  'Ask the review gate to recompute now rather than at the next sweep';

/**
 * A GitHub Actions expression as YAML spells it — `${{ inner }}`.
 *
 * Built rather than written literally. `${…}` inside a plain string is what a
 * mistyped template literal looks like, so biome's `noTemplateCurlyInString`
 * flags it and is right to in general; here the literal text is the subject of
 * the assertion, so the answer is to construct it rather than silence the rule.
 */
const expr = (inner) => `\${{ ${inner} }}`;

describe('the review is posted under the reviewer’s own identity', () => {
  it('submits with the App installation token, not the default GITHUB_TOKEN', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), SUBMIT_STEP);
    expect(step).toBeDefined();
    // The whole point: a fallback here silently unmatches every review.
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(
      expr('steps.reviewer-token.outputs.token'),
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
      `        # GH_TOKEN: ${expr('github.token')} — a comment, not the setting`,
      '        env:',
      `          GH_TOKEN: ${expr('steps.reviewer-token.outputs.token')}`,
    ].join('\n');
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(
      expr('steps.reviewer-token.outputs.token'),
    );
    expect(stepEnvValue(step, 'NOT_SET')).toBeUndefined();
  });

  // The scoping the JSDoc promises. Without it the `run:` line below is read as the
  // credential, and the assertion above would pass against a shell variable rather
  // than the step's env — the check would still be green and would mean nothing.
  it('reads the env mapping only, not a run: line that starts with the key', () => {
    const step = [
      '      - name: Example',
      '        env:',
      `          GH_TOKEN: ${expr('steps.reviewer-token.outputs.token')}`,
      '        run: |',
      '          GH_TOKEN: not-the-credential',
    ].join('\n');
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(
      expr('steps.reviewer-token.outputs.token'),
    );

    const noEnv = [
      '      - name: Example',
      '        run: |',
      '          GH_TOKEN: not-the-credential',
    ].join('\n');
    expect(stepEnvValue(noEnv, 'GH_TOKEN')).toBeUndefined();
  });

  // The dispatch legitimately keeps `github.token` — it needs `actions: write`,
  // which the App does not hold. Asserted so the assertion above is not read as
  // "this workflow must never use github.token".
  it('leaves the gate dispatch on github.token, which the App cannot replace', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), DISPATCH_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(expr('github.token'));
  });

  // `gh workflow run` with no `--ref` runs the DEFAULT BRANCH's copy of the gate,
  // so a pull request that edits the gate gets judged by the code it is replacing.
  // On #866 that overwrote a correct `success` with `pending` three seconds later.
  // Nothing else here would notice: the dispatch succeeds, the run is green, and
  // only the published status is wrong.
  it('dispatches the gate against the pull request’s own ref', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), DISPATCH_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('--ref "$HEAD_REF"');
    expect(step).toContain(
      `HEAD_REF: ${expr('github.event.pull_request.head.ref')}`,
    );
  });
});
