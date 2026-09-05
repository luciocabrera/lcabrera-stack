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

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  RULE,
  SKILL,
  SUBAGENT,
  makeConformanceRepo,
} from './lib/conformance-fixtures.mjs';

const require = createRequire(import.meta.url);
const { checkConformance } = require('./lib/conformance-check.cjs');

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const temporaryPaths = [];

afterEach(() => {
  for (const target of temporaryPaths.splice(0)) {
    rmSync(target, { force: true, recursive: true });
  }
});

const makeRepo = (files) => {
  const root = makeConformanceRepo(files);
  temporaryPaths.push(root);
  return root;
};

const messages = (repoRoot) =>
  checkConformance({ repoRoot }).findings.map((found) => found.message);

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
    temporaryPaths.push(root);

    expect(messages(root)).toEqual([
      'Artifact root not found: .github/skills',
      'Artifact root not found: .claude/rules',
      'Artifact root not found: .claude/agents',
    ]);
  });
});

describe('harness conformance — planted malformed frontmatter', () => {
  it('reports a skill whose frontmatter block never closes', () => {
    const repoRoot = makeRepo({
      '.github/skills/broken/SKILL.md': '---\nname: broken\n\n# Broken\n',
    });

    expect(messages(repoRoot)).toContain(
      'Unparseable or missing frontmatter in .github/skills/broken/SKILL.md',
    );
  });

  it('reports a rule with no paths to match on', () => {
    const repoRoot = makeRepo({
      '.claude/rules/no-paths.md': '---\ndescription: none\n---\n\n# Rule\n',
    });

    expect(messages(repoRoot)).toContain(
      'Missing required frontmatter field "paths" in .claude/rules/no-paths.md',
    );
  });

  it('reports a subagent whose name does not match its file', () => {
    const repoRoot = makeRepo({
      '.claude/agents/renamed.md': SUBAGENT,
    });

    expect(messages(repoRoot)).toContain(
      'Frontmatter name in .claude/agents/renamed.md does not match its file name: expected "renamed", got "demo-agent"',
    );
  });

  it('reports a skill with no description field at all', () => {
    const repoRoot = makeRepo({
      '.github/skills/bare/SKILL.md': '---\nname: bare\n---\n\n# Bare\n',
    });

    expect(messages(repoRoot)).toContain(
      'Missing required frontmatter field "description" in .github/skills/bare/SKILL.md',
    );
  });
});

describe('harness conformance — planted dead path references', () => {
  it('reports a rule that links a document that is not there', () => {
    const repoRoot = makeRepo({
      '.claude/rules/demo.md': `${RULE}\nSee [the decision](../../docs/decisions/ADR-000-gone.md).\n`,
    });

    expect(messages(repoRoot)).toContain(
      'Broken relative link in .claude/rules/demo.md: "../../docs/decisions/ADR-000-gone.md"',
    );
  });

  it('reports a subagent that names a script that is not there', () => {
    const repoRoot = makeRepo({
      '.claude/agents/demo-agent.md': `${SUBAGENT}\nRun \`bash .github/skills/demo/scripts/missing.sh\`.\n`,
    });

    expect(messages(repoRoot)).toContain(
      'Broken script path in .claude/agents/demo-agent.md: ".github/skills/demo/scripts/missing.sh"',
    );
  });

  it('reports a skill that links a document that is not there', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `${SKILL}\nSee [the guide](./references/gone.md).\n`,
    });

    expect(messages(repoRoot)).toContain(
      'Broken relative link in .github/skills/demo/SKILL.md: "./references/gone.md"',
    );
  });

  it('does not treat a node_modules consumer path as a missing repo script', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `${SKILL}\nruns \`node_modules/@repo/reporter/scripts/run-fallow.sh\`.\n`,
    });

    expect(messages(repoRoot)).toEqual([]);
  });

  it('keeps a resolving reference and an in-file anchor out of the findings', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `${SKILL}\n[here](#demo) and \`bash .github/skills/demo/scripts/run.sh\`\n`,
      '.github/skills/demo/scripts/run.sh': '#!/bin/sh\n',
    });

    expect(messages(repoRoot)).toEqual([]);
  });
});

describe('harness conformance — planted vague descriptions', () => {
  const skillWith = (description) => `---
name: demo
description: ${description}
---

# Demo
`;

  it('reports a description too short to carry a situation', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': skillWith('Code quality helper.'),
    });

    expect(messages(repoRoot)).toContain(
      'Vague description in .github/skills/demo/SKILL.md: 3 words is under the 12-word floor',
    );
  });

  it('reports a description that names nothing concrete', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': skillWith(
        'Helps the team keep things in good shape whenever the work starts to feel messy or slow.',
      ),
    });

    expect(messages(repoRoot)).toContain(
      'Vague description in .github/skills/demo/SKILL.md: names nothing concrete — no path, command or named subject',
    );
  });

  it('reports a description that never says when it applies', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': skillWith(
        'Runs `vp run check:safe` across apps/showcase and packages/ui, then writes a JSON report into reports/.',
      ),
    });

    expect(messages(repoRoot)).toContain(
      'Vague description in .github/skills/demo/SKILL.md: names no situation that selects it — say when it applies, what it follows, or what dispatches it',
    );
  });

  it('reads a block-scalar description as its text, not as the block marker', () => {
    const repoRoot = makeRepo({
      '.github/skills/demo/SKILL.md': `---
name: demo
description: |
  Standards for the demo fixture, which nothing else in scripts/lib covers.
  Use when a test needs a folded description that still passes every check.
---

# Demo
`,
    });

    expect(messages(repoRoot)).toEqual([]);
  });
});

describe('harness conformance — the gate itself', () => {
  const runCli = (cwd) =>
    execFileSync(
      process.execPath,
      [join(REPO_ROOT, 'scripts/verify-harness-conformance.cjs')],
      { cwd, encoding: 'utf8', stdio: 'pipe' },
    );

  it('exits zero and names what it read when nothing is wrong', () => {
    expect(runCli(makeRepo())).toContain(
      'Harness conformance passed: 1 path rules, 1 skills, 1 subagents.',
    );
  });

  it('exits non-zero on a planted violation', () => {
    const repoRoot = makeRepo({
      '.claude/rules/zz-probe.md': '# A rule with no frontmatter at all\n',
    });

    expect(() => runCli(repoRoot)).toThrowError(
      /Unparseable or missing frontmatter/,
    );
  });

  it('runs as its own unfiltered step on the merge bar', () => {
    const workflow = readFileSync(
      join(REPO_ROOT, '.github/workflows/check-safe.yml'),
      'utf8',
    );

    expect(workflow).toContain('vp run harness:verify');
    expect(workflow).not.toMatch(/^\s+paths:/m);
    expect(
      JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).scripts[
        'check:safe'
      ],
    ).toContain('vp run harness:verify');
  });
});
