import { describe, expect, it } from 'vite-plus/test';

import { SUBAGENT, conformanceMessages } from './conformance-fixtures.mjs';

describe('conformance contract — planted malformed frontmatter', () => {
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
    {
      files: { '.claude/rules/empty.md': '---\npaths: []\n---\n\n# Rule\n' },
      message:
        'Missing required frontmatter field "paths" in .claude/rules/empty.md',
      planted: 'a rule whose paths is an empty list',
    },
    {
      files: { '.claude/rules/blank.md': "---\npaths: ['']\n---\n\n# Rule\n" },
      message:
        'Missing required frontmatter field "paths" in .claude/rules/blank.md',
      planted: 'a rule whose paths holds one blank entry',
    },
    {
      files: {
        '.claude/rules/blank-block.md':
          '---\npaths:\n  - \'\'\n  - ""\n---\n\n# Rule\n',
      },
      message:
        'Missing required frontmatter field "paths" in .claude/rules/blank-block.md',
      planted: 'a rule whose paths is a block sequence of blank entries',
    },
    {
      files: {
        '.claude/agents/demo-agent.md':
          '---\nname: demo-agent\ndescription: []\n---\n\n# Agent\n',
      },
      message:
        'Missing required frontmatter field "description" in .claude/agents/demo-agent.md',
      planted: 'a subagent whose description is an empty list',
    },
  ])('reports $planted', ({ files, message }) => {
    expect(conformanceMessages(files)).toContain(message);
  });

  it('keeps a rule with one glob out of the findings', () => {
    expect(
      conformanceMessages({
        '.claude/rules/globbed.md': "---\npaths: ['**/*.ts']\n---\n\n# Rule\n",
      }),
    ).toEqual([]);
  });
});
