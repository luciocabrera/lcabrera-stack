/**
 * The subscription reviewer must stay on account auth, on a CLI this
 * repository pins, and must post from a step the model does not run.
 * A later edit that adds an API key, a marketplace action, or hands the
 * model the write token would leave the rest of the suite green.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  readRepoFile,
  stepBlock,
  stepEnvValue,
} from './workflow-inspect.mjs';

const WORKFLOW = '.github/workflows/grok-pr-review.yml';
const RUN_STEP = 'Run the Grok subscription review';
const SUBMIT_STEP =
  'Submit the review against the head this run was triggered for';
const INSTALL_STEP = 'Install the pinned Grok CLI';

const expr = (inner) => `\${{ ${inner} }}`;

const yaml = () => readRepoFile(WORKFLOW);

const executable = (source) =>
  source
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

describe('the subscription review does not use an API key', () => {
  it('reads GROK_AUTH_JSON, posts with GITHUB_TOKEN, and names no API key', () => {
    const source = executable(yaml());
    expect(source).toContain('secrets.GROK_AUTH_JSON');
    expect(source).toContain('secrets.GITHUB_TOKEN');
    expect(source).not.toContain('XAI_API_KEY');
    expect(source).not.toContain('xai-api-key');
    expect(source).not.toContain('xai_api_key');
    expect(source).not.toContain('0xr3ngar');
    expect(source).not.toContain('issues:');
  });

  it('fails closed when GROK_AUTH_JSON is empty', () => {
    const step = stepBlock(yaml(), RUN_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'GROK_AUTH_JSON')).toBe(
      expr('secrets.GROK_AUTH_JSON'),
    );
    expect(step).toContain('GROK_AUTH_JSON is empty');
  });

  it('does not hand the model step a GitHub token', () => {
    const step = stepBlock(yaml(), RUN_STEP);
    expect(stepEnvValue(step, 'GITHUB_TOKEN')).toBe("''");
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe("''");
    expect(step).toContain(
      "--tools 'read_file,grep,list_dir,search_replace'",
    );
    expect(step).not.toContain('run_terminal_command');
  });

  it('posts from submit-pr-review.mjs with GITHUB_TOKEN', () => {
    const step = stepBlock(yaml(), SUBMIT_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('scripts/submit-pr-review.mjs');
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(expr('secrets.GITHUB_TOKEN'));
  });
});

describe('the CLI is pinned', () => {
  it('names a version and a linux-x86_64 digest', () => {
    const source = yaml();
    expect(source).toContain("GROK_VERSION: '1.0.60'");
    expect(source).toContain(
      "GROK_SHA256: '10e6af64b24724fc1074c373e906b9ad121110044dddcbd97ad43c3a25f96d5f'",
    );
    const step = stepBlock(source, INSTALL_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('sha256sum -c');
    expect(step).toContain('linux-x86_64');
    expect(step).toContain("--proto '=https'");
    expect(step).toContain('--tlsv1.2');
    expect(step).not.toContain('install.sh');
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
