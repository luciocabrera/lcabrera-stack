import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

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
  const root = mkdtempSync(join(tmpdir(), 'validate-skills-'));
  temporaryDirectories.push(root);
  for (const [relative, contents] of Object.entries(files)) {
    const full = join(root, relative);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, contents);
  }
  return root;
};

const SKILL = `---
name: demo
description: A fixture skill used to pin the validator contract.
---

# Demo
`;

describe('validateSkills — missing SKILL.md', () => {
  it('fails a scripts-only folder that is not on the support allowlist', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': SKILL,
      '.github/skills/app-graph/scripts/generate.mjs': 'export {}\n',
    });

    const result = validateSkills({ repoRoot });

    expect(result.errors.some((error) => error.includes('app-graph'))).toBe(
      true,
    );
    expect(
      result.errors.some((error) => error.includes('Missing SKILL.md')),
    ).toBe(true);
    expect(result.skippedDirectories).not.toContain('app-graph');
  });

  it('skips an explicit support directory without SKILL.md', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': SKILL,
      '.github/skills/code-smell-shared/README.md': '# Shared\n',
    });

    const result = validateSkills({ repoRoot });

    expect(result.errors).toEqual([]);
    expect(result.skippedDirectories).toEqual(['code-smell-shared']);
  });
});

describe('validateSkills — dangling script paths', () => {
  it('fails when a SKILL.md names a relative script that does not exist', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `${SKILL}\nRun \`bash .github/skills/demo/scripts/missing.sh\`.\n`,
    });

    const result = validateSkills({ repoRoot });

    expect(
      result.errors.some(
        (error) =>
          error.includes('Broken script path') &&
          error.includes('.github/skills/demo/scripts/missing.sh'),
      ),
    ).toBe(true);
  });

  it('fails when an agent file names a relative script that does not exist', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': SKILL,
      '.claude/agents/fallow-scan.md':
        'pass a glob to `bash .github/skills/fallow-code-checker/scripts/run-fallow.sh`.\n',
    });

    const result = validateSkills({ repoRoot });

    expect(
      result.errors.some(
        (error) =>
          error.includes('.claude/agents/fallow-scan.md') &&
          error.includes(
            '.github/skills/fallow-code-checker/scripts/run-fallow.sh',
          ),
      ),
    ).toBe(true);
  });

  it('accepts a SKILL.md that names a script that exists', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `${SKILL}\nRun \`bash .github/skills/demo/scripts/run.sh\`.\n`,
      '.github/skills/demo/scripts/run.sh': '#!/bin/sh\n',
    });

    expect(validateSkills({ repoRoot }).errors).toEqual([]);
  });

  it('does not treat a node_modules consumer path as a missing repo script', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `${SKILL}\nruns \`node_modules/@repo/scan-report/scripts/run-fallow.sh\`.\n`,
    });

    expect(validateSkills({ repoRoot }).errors).toEqual([]);
  });
});

describe('validateSkills — this repository', () => {
  it('exits the live tree with no errors', () => {
    const result = validateSkills({ repoRoot: REPO_ROOT });

    expect(result.errors).toEqual([]);
    expect(result.skippedDirectories).toEqual(['code-smell-shared']);
  });
});
