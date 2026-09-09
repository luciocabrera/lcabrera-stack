/**
 * The Grok catalog reviewer posts under its own App and is not an accepted
 * reviewer. These assertions are the ones a fallback to github.token or a
 * dispatch into the Copilot gate would leave green everywhere else.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  commentProse,
  readRepoFile,
  stepBlock,
  stepEnvValue,
} from './workflow-inspect.mjs';

const WORKFLOW = '.github/workflows/grok-review.yml';
const PROMPT = '.github/workflows/grok-review.prompt.md';
const SUBMIT_STEP =
  'Submit the review against the head this run was triggered for';
const MINT_STEP = "Mint a token for the reviewer's own identity";
const COLLECT_STEP = 'Collect the pull request diff';
const RUN_STEP = 'Run the Grok catalog review';
const INSTALL_STEP = 'Install the pinned Grok CLI';

const expr = (inner) => `\${{ ${inner} }}`;

describe('the catalog review is posted under its own identity', () => {
  it('submits with the App installation token, not the default GITHUB_TOKEN', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), SUBMIT_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(
      expr('steps.reviewer-token.outputs.token'),
    );
  });

  it('mints that token from the Grok App, not Claude’s', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), MINT_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('actions/create-github-app-token');
    expect(step).toContain('secrets.GROK_REVIEWER_APP_ID');
    expect(step).toContain('secrets.GROK_REVIEWER_APP_PRIVATE_KEY');
    expect(step).not.toContain('secrets.REVIEWER_APP_ID');
    expect(step).toContain('id: reviewer-token');
  });

  it('collects the diff with github.token, which the App does not need to replace', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), COLLECT_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'GH_TOKEN')).toBe(expr('github.token'));
  });
});

describe('a run that reviews nothing must fail', () => {
  it('refuses to submit when grok-review-body.md is missing or empty', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), SUBMIT_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('[ ! -s grok-review-body.md ]');
    expect(step).toContain('(replace this file with the review body)');
    expect(step).toContain('exit 1');
  });

  it('skips drafts so a review is not paid for twice', () => {
    expect(readRepoFile(WORKFLOW)).toContain(
      'if: github.event.pull_request.draft == false',
    );
  });

  it('cancels a superseded run rather than posting a review of dead code', () => {
    const source = readRepoFile(WORKFLOW);
    expect(source).toContain('group: grok-review-');
    expect(source).toContain('github.event.pull_request.number');
    expect(source).toContain('cancel-in-progress: true');
  });
});

describe('the catalog reviewer is not wired into the Copilot gate', () => {
  it('does not dispatch copilot-review-gate.yml', () => {
    expect(readRepoFile(WORKFLOW)).not.toContain(
      'gh workflow run copilot-review-gate.yml',
    );
  });

  it('says in its own header that it is not an accepted reviewer', () => {
    expect(commentProse(readRepoFile(WORKFLOW))).toContain(
      'It is not an accepted reviewer',
    );
  });
});

describe('the model cannot write to GitHub', () => {
  it('restricts Grok to read, grep, list, and search-replace', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), RUN_STEP);
    expect(step).toBeDefined();
    expect(step).toContain("--tools 'read_file,grep,list_dir,search_replace'");
    expect(step).not.toContain('run_terminal_cmd');
    expect(step).not.toContain('run_terminal_command');
  });

  it('fails closed when XAI_API_KEY is empty', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), RUN_STEP);
    expect(step).toBeDefined();
    expect(stepEnvValue(step, 'XAI_API_KEY')).toBe(expr('secrets.XAI_API_KEY'));
    expect(step).toContain('XAI_API_KEY is empty');
  });
});

describe('the CLI is pinned', () => {
  it('names a version and a linux-x86_64 digest', () => {
    const source = readRepoFile(WORKFLOW);
    expect(source).toContain("GROK_VERSION: '1.0.24'");
    expect(source).toContain(
      "GROK_SHA256: 'a31a1c270246beb8e18f1fce91121a5e83d9ba8f51a8b24346bbc75fe727bdf5'",
    );
    const step = stepBlock(source, INSTALL_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('sha256sum -c');
    expect(step).toContain('linux-x86_64');
  });
});

describe('the prompt is the catalog, not a second generic review', () => {
  it('points at the zen skill and keeps MEDIUM findings out of threads', () => {
    const prompt = readRepoFile(PROMPT);
    expect(prompt).toContain('.github/skills/code-smell-zen/SKILL.md');
    expect(prompt).toContain('BLOCKER or HIGH');
    expect(prompt).toContain('MEDIUM, LOW, or NIT');
    expect(prompt).toContain('grok-review-findings.json');
    expect(prompt).toContain('no findings');
  });

  it('is the file the workflow concatenates into the prompt Grok sees', () => {
    const step = stepBlock(readRepoFile(WORKFLOW), RUN_STEP);
    expect(step).toBeDefined();
    expect(step).toContain('cat .github/workflows/grok-review.prompt.md');
  });
});
