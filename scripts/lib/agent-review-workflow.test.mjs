import { describe, expect, it } from 'vite-plus/test';

import {
  commentProse as prose,
  declaredNames as namesIn,
  readRepoFile,
  singleQuotedConst,
} from './workflow-inspect.mjs';

const WORKFLOW = '.github/workflows/agent-review-verdict.yml';
const GATE_SCRIPT = 'scripts/verify-agent-review.mjs';

const read = (path) => readRepoFile(path);

const statusContext = () => {
  const value = singleQuotedConst(read(GATE_SCRIPT), 'STATUS_CONTEXT');
  expect(
    value,
    `could not find STATUS_CONTEXT in ${GATE_SCRIPT} — if it moved, re-anchor this test`,
  ).toBeDefined();
  return value;
};

const declaredNames = () => namesIn(read(WORKFLOW));

const commentProse = () => prose(read(WORKFLOW));

describe('the agent-review workflow', () => {
  it('publishes a status context that is not empty', () => {
    expect(statusContext()).toBe('Agent review verdict');
  });

  it('declares names at all, so the assertions below are not vacuous', () => {
    expect(declaredNames().length).toBeGreaterThan(1);
  });

  it('names no job after the status context it publishes', () => {
    expect(declaredNames()).not.toContain(statusContext());
  });

  it('carries the warning, since #698 will read this file', () => {
    expect(commentProse()).toMatch(/ruleset contexts match by name/i);
  });
});

describe('the gate script — every line it prints', () => {
  it('writes only through the flattening helpers', () => {
    const rawWrites = [
      ...read(GATE_SCRIPT).matchAll(/console\.(?:log|error)\([ \t]*([^\n]*)/g),
    ]
      .map((match) => match[1].trim())
      .filter((argument) => !argument.startsWith('oneLine('));
    expect(rawWrites).toEqual([]);
  });

  it('writes at all, so the assertion above is not vacuous', () => {
    expect(read(GATE_SCRIPT)).toMatch(/console\.(?:log|error)\(/);
  });
});

describe('the agent-review workflow — what it deliberately does not do', () => {
  it('cancels no run that would publish a status', () => {
    expect(read(WORKFLOW)).not.toMatch(/cancel-in-progress:[ \t]*true/);
  });

  it('says why the group is absent, so the absence survives a refactor', () => {
    expect(commentProse()).toMatch(/no concurrency group/i);
  });
});
