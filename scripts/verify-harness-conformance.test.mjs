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

const findingsFor = (files) => messages(makeRepo(files));

describe('harness conformance — planted malformed frontmatter', () => {
  it.each([
    {
      files: {
        '.github/skills/broken/SKILL.md': '---\nname: broken\n\n# Broken\n',
      },
      message:
        'Unparseable or missing frontmatter in .github/skills/broken/SKILL.md',
      planted: 'a skill whose frontmatter block never closes',
    },
    {
      files: {
        '.claude/rules/no-paths.md': '---\ndescription: none\n---\n\n# Rule\n',
      },
      message:
        'Missing required frontmatter field "paths" in .claude/rules/no-paths.md',
      planted: 'a rule with no paths to match on',
    },
    {
      files: { '.claude/agents/renamed.md': SUBAGENT },
      message:
        'Frontmatter name in .claude/agents/renamed.md does not match its file name: expected "renamed", got "demo-agent"',
      planted: 'a subagent whose name does not match its file',
    },
    {
      files: {
        '.github/skills/bare/SKILL.md': '---\nname: bare\n---\n\n# Bare\n',
      },
      message:
        'Missing required frontmatter field "description" in .github/skills/bare/SKILL.md',
      planted: 'a skill with no description field at all',
    },
  ])('reports $planted', ({ files, message }) => {
    expect(findingsFor(files)).toContain(message);
  });
});

describe('harness conformance — planted dead path references', () => {
  it.each([
    {
      files: {
        '.claude/rules/demo.md': `${RULE}\nSee [the decision](../../docs/decisions/ADR-000-gone.md).\n`,
      },
      message:
        'Broken relative link in .claude/rules/demo.md: "../../docs/decisions/ADR-000-gone.md"',
      planted: 'a rule that links a document that is not there',
    },
    {
      files: {
        '.claude/agents/demo-agent.md': `${SUBAGENT}\nRun \`bash .github/skills/demo/scripts/missing.sh\`.\n`,
      },
      message:
        'Broken script path in .claude/agents/demo-agent.md: ".github/skills/demo/scripts/missing.sh"',
      planted: 'a subagent that names a script that is not there',
    },
    {
      files: {
        '.claude/agents/demo-agent.md': `---
name: demo-agent
description: Demo subagent for the conformance fixture. Use when a test needs one that runs .github/skills/demo/scripts/missing.sh on request.
---

# Demo agent
`,
      },
      message:
        'Broken script path in .claude/agents/demo-agent.md: ".github/skills/demo/scripts/missing.sh"',
      planted: 'a subagent whose description names a script that is not there',
    },
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\nSee [the guide](./references/gone.md).\n`,
      },
      message:
        'Broken relative link in .github/skills/demo/SKILL.md: "./references/gone.md"',
      planted: 'a skill that links a document that is not there',
    },
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\nSee [the register](docs/coordination/README.md).\n`,
        'docs/coordination/README.md': '# Register\n',
      },
      message:
        'Broken relative link in .github/skills/demo/SKILL.md: "docs/coordination/README.md"',
      planted: 'a skill link that only resolves from the repository root',
    },
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\nRun \`bash scripts/run.sh\`.\n`,
        '.github/skills/demo/scripts/run.sh': '#!/bin/sh\n',
      },
      message:
        'Broken script path in .github/skills/demo/SKILL.md: "scripts/run.sh"',
      planted: 'a bare script path that exists only beside the file naming it',
    },
  ])('reports $planted', ({ files, message }) => {
    expect(findingsFor(files)).toContain(message);
  });

  it.each([
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\nSee [the register](/docs/coordination/README.md).\n`,
        'docs/coordination/README.md': '# Register\n',
      },
      kept: 'a root-absolute link, which a renderer does resolve that way',
    },
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\nRun \`bash ./scripts/run.sh\`.\n`,
        '.github/skills/demo/scripts/run.sh': '#!/bin/sh\n',
      },
      kept: 'a dot-prefixed script path read from the file that names it',
    },
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\nruns \`node_modules/@repo/reporter/scripts/run-fallow.sh\`.\n`,
      },
      kept: 'a node_modules consumer path, which is not a missing repo script',
    },
    {
      files: {
        '.github/skills/demo/SKILL.md': `${SKILL}\n[here](#demo) and \`bash .github/skills/demo/scripts/run.sh\`\n`,
        '.github/skills/demo/scripts/run.sh': '#!/bin/sh\n',
      },
      kept: 'a resolving reference and an in-file anchor',
    },
  ])('keeps $kept out of the findings', ({ files }) => {
    expect(findingsFor(files)).toEqual([]);
  });
});

describe('harness conformance — planted vague descriptions', () => {
  const skillWith = (description) => `---
name: demo
description: ${description}
---

# Demo
`;
  const vague = (reason) =>
    `Vague description in .github/skills/demo/SKILL.md: ${reason}`;
  const nothingConcrete = vague(
    'names nothing concrete — no path, command or named subject',
  );

  it.each([
    {
      description: 'Code quality helper.',
      message: vague('3 words is under the 12-word floor'),
      planted: 'a description too short to carry a situation',
    },
    {
      description:
        'Helps the team keep things in good shape whenever the work starts to feel messy or slow.',
      message: nothingConcrete,
      planted: 'a description that names nothing concrete',
    },
    {
      description:
        'Helps the team keep things tidy and/or fast whenever the work starts to feel messy or slow.',
      message: nothingConcrete,
      planted: 'a description whose only slash is the one in "and/or"',
    },
    {
      description:
        'Helps whenever the work I am asked to do starts to feel messy, slow or hard to reason about.',
      message: nothingConcrete,
      planted: 'a description whose only capital is a lone mid-sentence "I"',
    },
    {
      description:
        'Runs `vp run check:safe` across apps/showcase and packages/ui, then writes a JSON report into reports/.',
      message: vague(
        'names no situation that selects it — say when it applies, what it follows, or what dispatches it',
      ),
      planted: 'a description that never says when it applies',
    },
  ])('reports $planted', ({ description, message }) => {
    expect(
      findingsFor({ '.github/skills/demo/SKILL.md': skillWith(description) }),
    ).toContain(message);
  });

  it('takes a script path as something concrete', () => {
    expect(
      findingsFor({
        '.github/skills/demo/SKILL.md': skillWith(
          'Runs scripts/foo.mjs whenever the fixture asks for a concrete path to be named in a description.',
        ),
        'scripts/foo.mjs': 'export {};\n',
      }),
    ).toEqual([]);
  });

  it('reads a block-scalar description as its text, not as the block marker', () => {
    expect(
      findingsFor({
        '.github/skills/demo/SKILL.md': `---
name: demo
description: |
  Standards for the demo fixture, which nothing else in scripts/lib covers.
  Use when a test needs a folded description that still passes every check.
---

# Demo
`,
      }),
    ).toEqual([]);
  });
});

describe('harness conformance — the gate itself', () => {
  const runCli = (cwd) =>
    execFileSync(
      process.execPath,
      [join(REPO_ROOT, 'scripts/verify-harness-conformance.cjs')],
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
    expect(runCli(makeRepo())).toContain(
      'Harness conformance passed: 1 path rule, 1 skill, 1 subagent.',
    );
  });

  it('reads back a plural count in the plural', () => {
    const repoRoot = makeRepo({
      '.claude/agents/second-agent.md': SUBAGENT.replace(
        'demo-agent',
        'second-agent',
      ),
    });

    expect(runCli(repoRoot)).toContain(
      'Harness conformance passed: 1 path rule, 1 skill, 2 subagents.',
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
