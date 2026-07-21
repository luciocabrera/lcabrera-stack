import { describe, expect, it } from 'vitest';

import {
  parseCommitHeader,
  validateCommitMessage,
  validatePrBody,
  validatePrTitle,
} from './commit-convention.mjs';

// This module is the ONE spec behind the commit-msg hook, the PR-standards CI
// gate, the changelog generator and the PR labeler. AGENTS.md Rule 13 forbids
// restating its type list anywhere else precisely so those four cannot drift —
// which makes the spec itself the thing that has to be pinned.

// A Set, matching what the hook and CI gate pass in.
const workspaces = new Set(['ui', 'server', 'admin_system', 'api-server']);
const errorsOf = (result) => result.errors;

describe('parseCommitHeader', () => {
  it('splits a conventional header into its parts', () => {
    expect(parseCommitHeader('feat(ui): add a Table filter')).toEqual({
      breaking: false,
      scope: 'ui',
      subject: 'add a Table filter',
      type: 'feat',
    });
  });

  it('reads the breaking-change marker and normalises the type case', () => {
    expect(
      parseCommitHeader('FIX(server)!: drop the legacy column'),
    ).toMatchObject({
      breaking: true,
      type: 'fix',
    });
  });

  it('leaves scope undefined when there is none', () => {
    expect(parseCommitHeader('docs: explain the gate')).toMatchObject({
      scope: undefined,
      type: 'docs',
    });
  });

  it('returns null for a non-conventional header', () => {
    expect(parseCommitHeader('added some stuff')).toBeNull();
    expect(parseCommitHeader('feat:no space after colon')).toBeNull();
    expect(parseCommitHeader('')).toBeNull();
    expect(parseCommitHeader(undefined)).toBeNull();
  });

  it('stays lenient about unknown types — shape only', () => {
    // The changelog generator and labeler need the shape without a verdict.
    expect(parseCommitHeader('wip(ui): something')).toMatchObject({
      type: 'wip',
    });
  });
});

describe('validateCommitMessage', () => {
  it('accepts a well-formed message', () => {
    const result = validateCommitMessage('feat(ui): add a Table filter', {
      workspaces,
    });
    expect(result).toMatchObject({ errors: [], skipped: false });
  });

  it('rejects a malformed header', () => {
    expect(
      errorsOf(validateCommitMessage('added some stuff', { workspaces })),
    ).not.toEqual([]);
  });

  it('rejects a type outside the allowed list', () => {
    expect(
      errorsOf(validateCommitMessage('wip(ui): something', { workspaces })),
    ).not.toEqual([]);
  });

  it('rejects an empty message', () => {
    expect(errorsOf(validateCommitMessage('', { workspaces }))).not.toEqual([]);
  });

  it('only WARNS about an unrecognised scope', () => {
    // A new area should not be blocked by the gate — deliberate, so scopes can
    // lead the workspace list rather than lag it.
    const result = validateCommitMessage('feat(nonexistent): x', {
      workspaces,
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).not.toEqual([]);
  });

  it('skips merge, revert and fixup messages', () => {
    for (const header of [
      "Merge branch 'main' into feature",
      'Merge pull request #123 from x/y',
      'Revert "feat(ui): add a Table filter"',
      'fixup! feat(ui): add a Table filter',
    ]) {
      expect(validateCommitMessage(header, { workspaces })).toMatchObject({
        errors: [],
        skipped: true,
      });
    }
  });

  it('accepts a body and a Co-Authored-By trailer', () => {
    const raw = [
      'fix(server): close the pool on shutdown',
      '',
      'Long explanation of why.',
      '',
      'Co-Authored-By: Someone <someone@example.com>',
    ].join('\n');

    expect(errorsOf(validateCommitMessage(raw, { workspaces }))).toEqual([]);
  });
});

describe('validatePrTitle', () => {
  it('holds a PR title to the same shape as a commit header', () => {
    expect(
      errorsOf(validatePrTitle('feat(ui): add a Table filter', { workspaces })),
    ).toEqual([]);
    expect(
      errorsOf(validatePrTitle('just some changes', { workspaces })),
    ).not.toEqual([]);
  });
});

describe('validatePrBody', () => {
  it('accepts a body with both required sections', () => {
    expect(
      errorsOf(
        validatePrBody('## What\n\nDid a thing.\n\n## Verification\n\nRan it.'),
      ),
    ).toEqual([]);
  });

  it('accepts any of the Verification aliases', () => {
    for (const heading of [
      'Verification',
      'Testing',
      'Test plan',
      'QA',
      'Tests',
    ]) {
      expect(
        errorsOf(validatePrBody(`## What\n\nx\n\n## ${heading}\n\ny`)),
      ).toEqual([]);
    }
  });

  it('rejects a body missing either section', () => {
    expect(errorsOf(validatePrBody('## What\n\nDid a thing.'))).not.toEqual([]);
    expect(errorsOf(validatePrBody('## Verification\n\nRan it.'))).not.toEqual(
      [],
    );
  });

  it('rejects an empty body', () => {
    expect(errorsOf(validatePrBody(''))).not.toEqual([]);
    expect(errorsOf(validatePrBody(undefined))).not.toEqual([]);
  });
});
