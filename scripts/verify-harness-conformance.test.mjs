import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  SUBAGENT,
  conformanceMessages,
  withConformanceRepo,
} from '../packages/repo-standards/scripts/conformance-fixtures.mjs';

const require = createRequire(import.meta.url);
const {
  checkConformance,
} = require('../packages/repo-standards/scripts/conformance-check.cjs');

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('harness conformance — the roster comes from disk', () => {
  it('checks every skill, rule and subagent in this repository', () => {
    const result = checkConformance({ repoRoot: REPO_ROOT });

    const skillDirectories = readdirSync(join(REPO_ROOT, '.github/skills'), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const stems = (relative) =>
      readdirSync(join(REPO_ROOT, relative))
        .filter((name) => name.endsWith('.md'))
        .map((name) => name.replace(/\.md$/, ''))
        .sort((a, b) => a.localeCompare(b));

    expect(result.checked.skill).toEqual(
      skillDirectories
        .filter((name) =>
          existsSync(join(REPO_ROOT, '.github/skills', name, 'SKILL.md')),
        )
        .sort((a, b) => a.localeCompare(b)),
    );
    expect(result.checked.rule).toEqual(stems('.claude/rules'));
    expect(result.checked.subagent).toEqual(stems('.claude/agents'));
    const alphabetical = (a, b) => a.localeCompare(b);

    expect(
      [...result.checked.skill, ...result.skippedDirectories].sort(
        alphabetical,
      ),
    ).toEqual([...skillDirectories].sort(alphabetical));
  });

  it('passes on the tree as it stands', () => {
    expect(checkConformance({ repoRoot: REPO_ROOT }).findings).toEqual([]);
  });

  it('reports a missing artifact root rather than checking nothing', () => {
    const root = mkdtempSync(join(tmpdir(), 'harness-conformance-empty-'));
    try {
      expect(
        checkConformance({ repoRoot: root }).findings.map(
          (found) => found.message,
        ),
      ).toEqual([
        'Artifact root not found: .github/skills',
        'Artifact root not found: .claude/rules',
        'Artifact root not found: .claude/agents',
      ]);
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('passes the fixture as seeded', () => {
    expect(conformanceMessages()).toEqual([]);
  });
});

describe('harness conformance — the gate itself', () => {
  const runCli = (cwd) =>
    execFileSync(
      process.execPath,
      [
        join(
          REPO_ROOT,
          'packages/repo-standards/scripts/verify-harness-conformance.cjs',
        ),
      ],
      { cwd, encoding: 'utf8', stdio: 'pipe' },
    );

  const triggerBlock = (workflow) => {
    const lines = workflow.split('\n');
    const start = lines.indexOf('on:');
    if (start === -1) {
      return '';
    }

    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => /^\S/.test(line));

    return rest.slice(0, end === -1 ? rest.length : end).join('\n');
  };

  it('exits zero and names what it read when nothing is wrong', () => {
    expect(withConformanceRepo({}, runCli)).toContain(
      'Harness conformance passed: 1 path rule, 1 skill, 1 subagent.',
    );
  });

  it('reads back a plural count in the plural', () => {
    expect(
      withConformanceRepo(
        {
          '.claude/agents/second-agent.md': SUBAGENT.replace(
            'demo-agent',
            'second-agent',
          ),
        },
        runCli,
      ),
    ).toContain(
      'Harness conformance passed: 1 path rule, 1 skill, 2 subagents.',
    );
  });

  it('exits non-zero on a planted violation', () => {
    expect(() =>
      withConformanceRepo(
        {
          '.claude/rules/zz-probe.md': '# A rule with no frontmatter at all\n',
        },
        runCli,
      ),
    ).toThrowError(/Unparseable or missing frontmatter/);
  });

  it('runs as its own unfiltered step on the merge bar', () => {
    const workflow = readFileSync(
      join(REPO_ROOT, '.github/workflows/check-safe.yml'),
      'utf8',
    );
    const triggers = triggerBlock(workflow);

    expect(workflow).toContain('vp run harness:verify');
    expect(triggers).toContain('pull_request:');
    expect(triggers).not.toMatch(/^[ \t]*paths(-ignore)?:/m);
    expect(
      JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).scripts[
        'check:safe'
      ],
    ).toContain('vp run harness:verify');
  });

  it('would catch a path filter on the trigger, in either spelling', () => {
    const filtered = [
      'on:',
      '  pull_request:',
      "    paths-ignore: ['**/*.md']",
      'jobs:',
      '  quality-gate:',
    ].join('\n');

    expect(triggerBlock(filtered)).toMatch(/^[ \t]*paths(-ignore)?:/m);
  });
});
