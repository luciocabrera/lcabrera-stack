import { describe, expect, it } from 'vite-plus/test';

import {
  RULE,
  SKILL,
  SUBAGENT,
  conformanceMessages,
} from './conformance-fixtures.mjs';

describe('conformance references — planted dead path references', () => {
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
    expect(conformanceMessages(files)).toContain(message);
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
    expect(conformanceMessages(files)).toEqual([]);
  });
});
