import { describe, expect, it } from 'vite-plus/test';

import { readRepoFile, stepBlock, stepEnvValue } from './workflow-inspect.mjs';

const WORKFLOW = '.github/workflows/claude-review.yml';
const SUBMIT_STEP =
  'Submit the review against the head this run was triggered for';
const MINT_STEP = "Mint a token for the reviewer's own identity";
const DISPATCH_STEP =
  'Ask the review gate to recompute now rather than at the next sweep';

const expr = (inner) => `\${{ ${inner} }}`;

describe('the review is posted under the reviewer’s own identity', () => {
  it('submits with the App installation token, not the default GITHUB_TOKEN', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), SUBMIT_STEP);
    expect(step).toBeDefined();
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

  it('leaves the gate dispatch on github.token, which the App cannot replace', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), DISPATCH_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(expr('github.token'));
  });

  it('dispatches the gate against the pull request’s own ref', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), DISPATCH_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('--ref "$HEAD_REF"');
    expect(step).toContain(
      `HEAD_REF: ${expr('github.event.pull_request.head.ref')}`,
    );
  });
});
