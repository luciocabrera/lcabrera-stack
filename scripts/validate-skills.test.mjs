import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { makeConformanceRepo } from './lib/conformance-fixtures.mjs';

const require = createRequire(import.meta.url);
const { validateSkills } = require('./lib/validate-skills-contract.cjs');

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

const makeRepo = (files) => {
  const root = makeConformanceRepo(files);
  temporaryDirectories.push(root);
  return root;
};

describe('validateSkills — missing SKILL.md', () => {
  it('fails a scripts-only folder that is not on the support allowlist', () => {
    const repoRoot = makeRepo({
      '.github/skills/scripts-only/scripts/generate.mjs': 'export {}\n',
    });

    const result = validateSkills({ repoRoot });

    expect(result.errors.some((error) => error.includes('scripts-only'))).toBe(
      true,
    );
    expect(
      result.errors.some((error) => error.includes('Missing SKILL.md')),
    ).toBe(true);
    expect(result.skippedDirectories).not.toContain('scripts-only');
    expect(result.checkedSkills).toContain('scripts-only');
  });

  it('skips an explicit support directory without SKILL.md', () => {
    const repoRoot = makeRepo({
      '.github/skills/code-smell-shared/README.md': '# Shared\n',
    });

    const result = validateSkills({ repoRoot });

    expect(result.errors).toEqual([]);
    expect(result.skippedDirectories).toEqual(['code-smell-shared']);
    expect(result.checkedSkillCount).toBe(1);
  });
});

describe('validateSkills — this repository', () => {
  it('exits the live tree with no errors', () => {
    const result = validateSkills({ repoRoot: REPO_ROOT });

    expect(result.errors).toEqual([]);
    expect(result.skippedDirectories).toEqual(['code-smell-shared']);
  });

  it('CI is not path-filtered, so a moved referenced script still runs the gate', () => {
    const yaml = readFileSync(
      join(REPO_ROOT, '.github/workflows/validate-skills.yml'),
      'utf8',
    );

    expect(yaml).not.toMatch(/^\s+paths:/m);
  });
});
