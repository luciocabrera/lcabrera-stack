import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  validateIssueBody,
  validatePrBody,
} from '../../packages/repo-standards/scripts/commit-convention.mjs';

// The templates GitHub prefills, and the checks that judge what comes back.
//
// `.github/pull_request_template.md` and `.github/ISSUE_TEMPLATE/standard_issue.md`
// are prose files with no consumer inside the repo, so nothing noticed if a
// heading drifted out of the shape `packages/repo-standards/scripts/commit-convention.mjs` matches.
// The cost lands on the NEXT author: pr-standards.yml rejects a description they
// copied verbatim from the template, and the person who edited the heading is
// long gone. These assertions move that failure to the PR that causes it.
//
// It is not hypothetical. docs/agents/templates-spec.md records Deviation 1 —
// the source specification spells the headings `## **📝 1. What**`, which
// `/^#{1,6}\s+what\b/im` cannot match. The only thing that stood between that
// spelling and a permanently red gate was a comment in the template, and it
// asked editors to keep two of the six required headings plain — so four of them
// were decoratable as far as any reader could tell.
//
// scripts/coordination-claim.sh is here for the same reason: it generates a full
// issue body and a full draft-PR body inline, so the repo's own tooling can
// start opening work that fails the repo's own standard.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PR_TEMPLATE = '.github/pull_request_template.md';
const ISSUE_TEMPLATE = '.github/ISSUE_TEMPLATE/standard_issue.md';
const CLAIM_SCRIPT = 'scripts/coordination-claim.sh';

const read = (path) => readFileSync(join(REPO_ROOT, path), 'utf8');

/** GitHub strips the YAML frontmatter before posting an issue, so the body a
 *  real issue carries — and the body issue-standards.yml validates — is what
 *  follows it. Strip it here too rather than validating text no issue contains. */
const withoutFrontmatter = (source) =>
  source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');

/** Pulls one of the claim script's generated bodies out of its shell source.
 *  Anchored on both ends, and asserted rather than defaulted: if the script is
 *  restructured, this fails loudly instead of quietly validating an empty
 *  string — which would pass every assertion below while checking nothing. */
const bodyFromClaimScript = (anchor, label) => {
  const match = anchor.exec(read(CLAIM_SCRIPT));
  expect(
    match,
    `could not locate the ${label} in ${CLAIM_SCRIPT} — if it moved, re-anchor this test`,
  ).not.toBeNull();
  return match[1];
};

// The shell interpolations left in these blocks (`${title}`, `$(printf …)`) fill
// in VALUES, never headings, so the literal text is what the gate will see.
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
    // The spec's own spelling. Pinning the negative keeps this file honest: an
    // assertion that only ever proves a pass cannot tell working from vacuous.
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
    // Without it the file is present and never shown to anyone — a broken
    // feature that looks exactly like a working one.
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
    // Both anchors resolving to one block would make the pair above agree with
    // itself. They are disjoint by construction; this says so out loud.
    expect(claimIssueBody()).not.toBe(claimPrBody());
    expect(claimIssueBody()).toMatch(/^#{1,6}\s/m);
    expect(claimPrBody()).toMatch(/^#{1,6}\s/m);
  });
});
