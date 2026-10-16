/**
 * The subscription reviewer must stay on account auth. A later edit that
 * adds XAI_API_KEY, drops the fork skip, or shares grok-review.yml's
 * concurrency group would bill the API or cancel the catalog pass, and
 * nothing else in the suite would go red.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { describe, expect, it } from 'vite-plus/test';

import { readRepoFile } from './workflow-inspect.mjs';

const WORKFLOW = '.github/workflows/grok-pr-review.yml';

const yaml = () => readRepoFile(WORKFLOW);

const executable = (source) =>
  source
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

describe('the subscription review does not use an API key', () => {
  it('reads GROK_AUTH_JSON and GITHUB_TOKEN, and names no API key', () => {
    const source = executable(yaml());
    expect(source).toContain('secrets.GROK_AUTH_JSON');
    expect(source).toContain('secrets.GITHUB_TOKEN');
    expect(source).not.toContain('XAI_API_KEY');
    expect(source).not.toContain('xai-api-key');
    expect(source).not.toContain('xai_api_key');
  });

  it('pins the review action to the v1.0.2 commit', () => {
    expect(yaml()).toContain(
      '0xr3ngar/grok-build-review-action@eded30018cdee4e83dfca14d18f292b860c30cdd',
    );
  });
});

describe('runs are bounded', () => {
  it('skips drafts and pull requests from another repository', () => {
    expect(yaml()).toContain(
      'if: github.event.pull_request.draft == false && github.event.pull_request.head.repo.full_name == github.repository',
    );
  });

  it('cancels a superseded run without cancelling the catalog review', () => {
    const source = yaml();
    expect(source).toContain(
      'group: grok-pr-review-${{ github.event.pull_request.number }}',
    );
    expect(source).toContain('cancel-in-progress: true');
    expect(source).not.toContain('group: grok-review-');
  });

  it('does not use pull_request_target', () => {
    expect(executable(yaml())).not.toContain('pull_request_target');
  });

  it('tells the operator how to create the secret', () => {
    const source = yaml();
    expect(source).toContain('cat ~/.grok/auth.json');
    expect(source).toContain(
      'Settings → Secrets and variables → Actions → New repository secret',
    );
    expect(source).toContain(
      'gh secret set GROK_AUTH_JSON < ~/.grok/auth.json',
    );
  });
});
