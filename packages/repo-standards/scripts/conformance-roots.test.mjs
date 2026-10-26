import { describe, expect, it } from 'vite-plus/test';

import { conformanceMessages, RULE, SKILL } from './conformance-fixtures.mjs';

const CONFIG = JSON.stringify({
  gates: {
    harness: {
      additionalRoots: [
        { dir: 'shipped/skills', kind: 'skill' },
        { dir: 'shipped/rules', kind: 'rule' },
      ],
    },
  },
});

const SHIPPED = {
  'devkit.config.json': CONFIG,
  'shipped/rules/demo.md': RULE,
  'shipped/skills/demo/SKILL.md': SKILL,
};

describe('conformance — roots a repository adds', () => {
  it('passes a conforming artifact under an added root', () => {
    expect(conformanceMessages(SHIPPED)).toEqual([]);
  });

  it.each([
    {
      files: {
        'shipped/skills/demo/SKILL.md': SKILL.replace(
          '\n---\n\n# Demo',
          '\n--\n\n# Demo\n\n---\n',
        ),
      },
      message:
        'Frontmatter in shipped/skills/demo/SKILL.md is not valid YAML: Implicit map keys need to be followed by map values (line 4)',
      planted: 'a skill whose closing fence is broken',
    },
    {
      files: {
        'shipped/skills/demo/SKILL.md':
          '---\nname: demo\ndescription: code quality helper\n---\n\n# Demo\n',
      },
      message:
        'Vague description in shipped/skills/demo/SKILL.md: 3 words is under the 12-word floor',
      planted: 'a skill with a vague description',
    },
    {
      files: {
        'shipped/rules/demo.md': RULE.replace('paths:', 'pathz:'),
      },
      message:
        'Missing required frontmatter field "paths" in shipped/rules/demo.md',
      planted: 'a rule whose paths key is misspelled',
    },
  ])('names the file for $planted', ({ files, message }) => {
    expect(conformanceMessages({ ...SHIPPED, ...files })).toContain(message);
    expect(
      conformanceMessages({ ...SHIPPED, ...files, 'devkit.config.json': '{}' }),
    ).toEqual([]);
  });

  it('reports an added root that does not exist', () => {
    expect(conformanceMessages({ 'devkit.config.json': CONFIG })).toEqual([
      'Artifact root not found: shipped/skills',
      'Artifact root not found: shipped/rules',
    ]);
  });
});
