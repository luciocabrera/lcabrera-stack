import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  RULE,
  conformanceMessages,
  withConformanceRepo,
} from '../packages/repo-standards/scripts/conformance-fixtures.mjs';

const require = createRequire(import.meta.url);
const { validateSkills } = require('./lib/validate-skills-contract.cjs');

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const skillsView = (files) =>
  withConformanceRepo(files, (repoRoot) => validateSkills({ repoRoot }));

describe('validateSkills — missing SKILL.md', () => {
  it('fails a scripts-only folder that is not on the support allowlist', () => {
    const result = skillsView({
      '.github/skills/scripts-only/scripts/generate.mjs': 'export {}\n',
    });

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
    const result = skillsView({
      '.github/skills/code-smell-shared/README.md': '# Shared\n',
    });

    expect(result.errors).toEqual([]);
    expect(result.skippedDirectories).toEqual(['code-smell-shared']);
    expect(result.checkedSkillCount).toBe(1);
  });
});

describe('validateSkills — the projection is skills only', () => {
  it('leaves a rule finding to the harness gate', () => {
    const files = {
      '.claude/rules/demo.md': `${RULE}\nSee [the decision](../../docs/decisions/ADR-000-gone.md).\n`,
    };
    const message =
      'Broken relative link in .claude/rules/demo.md: "../../docs/decisions/ADR-000-gone.md"';

    expect(conformanceMessages(files)).toContain(message);
    expect(skillsView(files).errors).not.toContain(message);
  });

  it('leaves a subagent finding to the harness gate', () => {
    const files = {
      '.claude/agents/demo-agent.md': '---\nname: demo-agent\n---\n\n# Bare\n',
    };
    const message =
      'Missing required frontmatter field "description" in .claude/agents/demo-agent.md';

    expect(conformanceMessages(files)).toContain(message);
    expect(skillsView(files).errors).not.toContain(message);
  });

  it('reports a skill finding in both views', () => {
    const files = {
      '.github/skills/bare/SKILL.md': '---\nname: bare\n---\n\n# Bare\n',
    };
    const message =
      'Missing required frontmatter field "description" in .github/skills/bare/SKILL.md';

    expect(conformanceMessages(files)).toContain(message);
    expect(skillsView(files).errors).toContain(message);
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

    expect(yaml).not.toMatch(/^[ \t]+paths:/m);
  });
});
