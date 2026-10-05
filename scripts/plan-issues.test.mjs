import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const scratchRoot = join(REPO_ROOT, '.tmp');
mkdirSync(scratchRoot, { recursive: true });
const scratch = mkdtempSync(join(scratchRoot, 'plan-issues-test-'));

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

const entry = (id, dependencies) =>
  [
    `### ${id} — \`docs(x): ${id}\``,
    '',
    '**1. Problem Statement.** Something.',
    '',
    '**2. Objective.** Something.',
    '',
    '**6. Acceptance Criteria.**',
    '',
    '- [ ] One',
    '',
    '```yaml',
    'labels: [type: docs]',
    'milestone: M4 - Hardening & QA',
    dependencies,
    '```',
    '',
  ].join('\n');

const runPlan = (markdown) => {
  const file = join(scratch, `plan-${Date.now()}.md`);
  writeFileSync(file, markdown);
  return spawnSync(
    process.execPath,
    [
      join(REPO_ROOT, 'scripts/plan-issues.mjs'),
      '--plan',
      relative(REPO_ROOT, file),
    ],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );
};

describe('plan-issues', () => {
  it('reports every entry whose dependencies do not parse, then fails', () => {
    const result = runPlan(
      [
        '# Plan',
        '',
        entry('P-01', 'dependencies:\n  blockedby: [P-02]'),
        entry('P-02', 'dependencies:\n  blockedBy: [P-01]'),
        entry('P-03', 'dependencies:\n  blockedBy: P-02'),
      ].join('\n'),
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('3 issue(s)');
    expect(result.stderr).toContain(
      '✗ P-01: cannot parse dependencies — unknown dependency key(s): blockedby',
    );
    expect(result.stderr).toContain(
      '✗ P-03: cannot parse dependencies — blockedBy is not a list of issue ids',
    );
    expect(result.stderr).not.toContain('✗ P-02');
    expect(result.stderr).toContain('2 issue(s) would not survive creation');
  });
});
