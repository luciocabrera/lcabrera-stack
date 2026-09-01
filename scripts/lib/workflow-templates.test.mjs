import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  validateIssueBody,
  validatePrBody,
} from '../../packages/repo-standards/scripts/commit-convention.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PR_TEMPLATE = '.github/pull_request_template.md';
const ISSUE_TEMPLATE = '.github/ISSUE_TEMPLATE/standard_issue.md';
const CLAIM_SCRIPT = 'scripts/coordination-claim.sh';

const read = (path) => readFileSync(join(REPO_ROOT, path), 'utf8');

const withoutFrontmatter = (source) =>
  source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

const bodyFromClaimScript = (anchor, label) => {
  const match = anchor.exec(read(CLAIM_SCRIPT));
  expect(
    match,
    `could not locate the ${label} in ${CLAIM_SCRIPT} — if it moved, re-anchor this test`,
  ).not.toBeNull();
  return match[1];
};

const claimIssueBody = () =>
  bodyFromClaimScript(
    /^\s*cat <<BODY$\n([\s\S]*?)^BODY$/m,
    'issue body heredoc',
  );

const claimPrBody = () =>
  bodyFromClaimScript(/^body="([\s\S]*?)"\nrun gh pr create/m, 'draft-PR body');

describe('the shipped PR template', () => {
  it('passes the check that runs on every pull request', () => {
    expect(validatePrBody(read(PR_TEMPLATE)).errors).toEqual([]);
  });

  it('fails once a required heading is decorated (Deviation 1)', () => {
    const decorated = read(PR_TEMPLATE).replace(
      /^## What$/m,
      '## **📝 1. What**',
    );
    expect(decorated, 'the `## What` heading moved — re-target this').not.toBe(
      read(PR_TEMPLATE),
    );
    expect(validatePrBody(decorated).errors).not.toEqual([]);
  });

  it.each([
    'Why',
    'Verification',
    'Impact Analysis',
    'Test Coverage',
    'Documentation Updates',
  ])('fails once `## %s` is decorated too', (heading) => {
    const template = read(PR_TEMPLATE);
    const decorated = template.replace(
      new RegExp(`^## ${heading}$`, 'mu'),
      `## **✨ ${heading}**`,
    );
    expect(decorated, `the \`## ${heading}\` heading moved`).not.toBe(template);
    expect(validatePrBody(decorated).errors).not.toEqual([]);
  });
});

describe('the shipped issue template', () => {
  it('keeps the frontmatter GitHub needs in order to offer it', () => {
    expect(read(ISSUE_TEMPLATE)).toMatch(/^---\r?\n[\s\S]*?\bname:/);
  });

  it('passes the check that runs on every issue', () => {
    expect(
      validateIssueBody(withoutFrontmatter(read(ISSUE_TEMPLATE))).errors,
    ).toEqual([]);
  });

  it('fails once a required heading is decorated', () => {
    const body = withoutFrontmatter(read(ISSUE_TEMPLATE));
    const decorated = body.replace(
      /^## 1\. Problem Statement$/m,
      '## **🧭 1. Problem Statement**',
    );
    expect(decorated, 'the Problem Statement heading moved').not.toBe(body);
    expect(validateIssueBody(decorated).errors).not.toEqual([]);
  });
});

describe('the bodies coordination:claim generates', () => {
  it('opens a tracking issue that passes the issue gate', () => {
    expect(validateIssueBody(claimIssueBody()).errors).toEqual([]);
  });

  it('opens a draft PR that passes the PR gate', () => {
    expect(validatePrBody(claimPrBody()).errors).toEqual([]);
  });

  it('reads two distinct bodies, not the same block twice', () => {
    expect(claimIssueBody()).not.toBe(claimPrBody());
    expect(claimIssueBody()).toMatch(/^#{1,6}\s/m);
    expect(claimPrBody()).toMatch(/^#{1,6}\s/m);
  });
});
