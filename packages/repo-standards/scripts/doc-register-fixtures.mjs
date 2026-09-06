/**
 * A synthetic repository holding both doc registers, for the tests that run the
 * gate and the two reports as processes.
 *
 * A synthetic tree rather than this one: the gate reads the working directory,
 * so planting a violation in the tracked register would leave the checkout
 * dirty on any failure and race a second runner. Everything the gate reads is
 * built here — the workspace roster, the root manifest, one workflow, and the
 * two registers — which is also what makes each planted violation the ONLY
 * difference between a failing run and a passing one.
 */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const REQUIREMENT_DIR = 'docs/product/requirements';
export const PLANNING_DIR = 'docs/agents/planning';

export const REQUIREMENT = `---
id: render-a-table
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires:
  - sql-is-safe
issues:
  - 994
evidence:
  - type: code
    ref: packages/ui/package.json
  - type: command
    ref: vp run suppressions:list
---

# Render a table from rows alone

## Statement

I have rows and columns and want a table on the page.

## Acceptance

- The package's entry map resolves a component taking both.
`;

export const MET_REQUIREMENT = `---
id: sql-is-safe
lines:
  - application
persona: application-developer
state: met
packages:
  - server
requires: []
issues: []
evidence:
  - type: command
    ref: vp run test:ci
---

# SQL is injection-safe by construction

## Statement

I compose a query and cannot express an injection.

## Acceptance

- \`vp run test:ci\` covers the identifier quoting.
`;

export const PLAN = `---
kind: plan
status: live
recorded: 2026-08-11
issues: ['#547']
packages: [ui, server]
---

# A plan

Its reasoning.
`;

export const DRAFT = `# A proposed decision

Holding no number until it is adopted.
`;

const WORKFLOW = `name: Check

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  gate:
    steps:
      - name: Tests
        run: vp run test:ci
`;

const MANIFEST = `${JSON.stringify(
  {
    name: 'fixture',
    scripts: {
      'suppressions:list': 'node scripts/verify-suppressions.mjs --list',
      'test:ci': 'vitest run',
    },
  },
  undefined,
  2,
)}\n`;

const roots = [];

export const writeIn = (root) => (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

export const editIn = (root) => (path, from, to) => {
  const full = join(root, path);
  const before = readFileSync(full, 'utf8');
  const after = before.replace(from, to);
  if (after === before) {
    throw new Error(`fixture: \`${from}\` is not in ${path}`);
  }
  writeFileSync(full, after);
};

export const makeRegisterRepo = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'doc-registers-')));
  roots.push(root);
  const write = writeIn(root);
  write('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n");
  write('packages/ui/package.json', '{ "name": "@lcabrera/ui" }\n');
  write('packages/server/package.json', '{ "name": "@lcabrera/server" }\n');
  write('package.json', MANIFEST);
  write('.github/workflows/check.yml', WORKFLOW);
  write(`${REQUIREMENT_DIR}/render-a-table.md`, REQUIREMENT);
  write(`${REQUIREMENT_DIR}/sql-is-safe.md`, MET_REQUIREMENT);
  write(`${PLANNING_DIR}/a-plan.md`, PLAN);
  write(`${PLANNING_DIR}/adr-drafts/a-draft.md`, DRAFT);
  return root;
};

export const removeRegisterRepos = () => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
};
